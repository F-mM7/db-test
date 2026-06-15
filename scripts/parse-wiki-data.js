#!/usr/bin/env node

import * as cheerio from 'cheerio';
import process from 'process';
import { loadHtml, loadJson, writeJson, dataDir, publicDir } from './lib/io.js';
import { assertCount, DATASETS } from './lib/validate.js';

const CELL_PATTERNS = {
  WITH_C_INGREDIENT: {
    AAA: { start: 10, cells: 2 },
    AAC: { start: 16, cells: 4 },
    ABB: { start: 24, cells: 4 }
  },
  WITHOUT_C_INGREDIENT: {
    AAA: { start: 10, cells: 2 },
    ABB: { start: 21, cells: 4 }
  }
};

const MIN_CELLS = { WITH_C: 34, WITHOUT_C: 26 };

function getIngredientFromCell($, cell) {
  const img = $(cell).find('img');
  return img.length > 0 ? (img.attr('alt') || img.attr('title') || '') : '';
}

function parseAAAPattern($, cells, start) {
  const ingredient = getIngredientFromCell($, cells[start]);
  const value = parseFloat($(cells[start + 1]).text().trim());
  if (!ingredient || isNaN(value)) return null;
  return {
    ingredients: [ingredient, ingredient, ingredient],
    individualValues: { [ingredient]: value }
  };
}

function parseFourCellPattern($, cells, start, patternName) {
  const ingredientA = getIngredientFromCell($, cells[start]);
  const valueA = parseFloat($(cells[start + 1]).text().trim());
  const ingredientB = getIngredientFromCell($, cells[start + 2]);
  const valueB = parseFloat($(cells[start + 3]).text().trim());
  if (!ingredientA || !ingredientB || isNaN(valueA) || isNaN(valueB)) return null;

  // AAC は A,A,C / それ以外（ABB）は A,B,B
  const ingredients = patternName === 'AAC'
    ? [ingredientA, ingredientA, ingredientB]
    : [ingredientA, ingredientB, ingredientB];

  return {
    ingredients,
    individualValues: { [ingredientA]: valueA, [ingredientB]: valueB }
  };
}

function parsePattern($, cells, patternName, config) {
  const { start, cells: cellCount } = config;
  if (start + cellCount > cells.length) return null;
  if (cellCount === 2) return parseAAAPattern($, cells, start);
  if (cellCount === 4) return parseFourCellPattern($, cells, start, patternName);
  return null;
}

function parsePokemonRow($, cells, id) {
  if (cells.length < MIN_CELLS.WITHOUT_C) {
    console.warn(`Row has ${cells.length} cells, expected at least ${MIN_CELLS.WITHOUT_C}`);
    return null;
  }
  const hasC = cells.length >= MIN_CELLS.WITH_C;

  // <br> による改行を含む名前を 1 行に正規化（例: バケッチャ(こだま)、ピカチュウ(ハロウィン)）
  const name = $(cells[1]).text().trim().replace(/\n+/g, '');
  if (!name) {
    console.warn('No Pokemon name found');
    return null;
  }

  console.log(`Parsing: ${name} (${cells.length} cells${!hasC ? ' - no C ingredient' : ''})`);

  const patterns = hasC ? CELL_PATTERNS.WITH_C_INGREDIENT : CELL_PATTERNS.WITHOUT_C_INGREDIENT;
  const ingredientPatterns = {};
  for (const [patternName, config] of Object.entries(patterns)) {
    const data = parsePattern($, cells, patternName, config);
    if (data) ingredientPatterns[patternName] = data;
  }

  return { id, name, ingredientPatterns };
}

function parseHtmlTable(html) {
  const $ = cheerio.load(html);
  const table = $('table').first();
  if (table.length === 0) throw new Error('No table found in HTML');

  console.log(`Processing table with ${table.find('tr').length} rows`);

  const pokemonList = [];
  let id = 1;
  let failed = 0;
  let incomplete = 0;

  table.find('tbody tr').each((rowIndex, row) => {
    const cells = $(row).find('td');
    // 列数が下限未満の行は区切り・注釈などの非データ行とみなして静かにスキップする
    if (cells.length < MIN_CELLS.WITHOUT_C) return;

    try {
      const pokemon = parsePokemonRow($, cells, id);
      const got = pokemon ? Object.keys(pokemon.ingredientPatterns).length : 0;
      // データ行の体裁なのに名前欠落・全パターン抽出失敗＝構造崩壊の兆候として計上
      if (!pokemon || got === 0) {
        failed++;
        return;
      }
      // 一部パターンだけの欠損（例: C食材が未確定）は警告のみ。総量は assertCount で担保する。
      const expected = cells.length >= MIN_CELLS.WITH_C ? 3 : 2;
      if (got < expected) {
        console.warn(`Incomplete patterns for "${pokemon.name}": ${got}/${expected}`);
        incomplete++;
      }
      pokemonList.push(pokemon);
      id++;
    } catch (error) {
      console.warn(`Error parsing row ${rowIndex}:`, error.message);
      failed++;
    }
  });

  console.log(`✓ Successfully parsed: ${pokemonList.length} Pokemon`);
  console.log(`✗ Failed (data-shaped rows): ${failed}, ⚠ Incomplete patterns: ${incomplete}`);
  if (pokemonList.length === 0) throw new Error('No Pokemon data extracted from table');
  // データ行の体裁なのに抽出に失敗した行は劣化の兆候。黙って通さず中止する。
  if (failed > 0) {
    throw new Error(`${failed} 行のデータパースに失敗しました。Wiki のテーブル構造変更が疑われます。`);
  }
  return pokemonList;
}

export function parseWikiData() {
  console.log('Pokemon Sleep Wiki Data Parser');
  console.log('==============================');

  try {
    const html = loadHtml('wiki-raw.html', 'Please run "npm run download-wiki" first.');
    const previous = loadJson(DATASETS.pokemon.file);
    const pokemonList = parseHtmlTable(html);

    assertCount(DATASETS.pokemon.label, pokemonList.length, {
      absoluteMin: DATASETS.pokemon.absoluteMin,
      previousCount: previous?.length ?? null
    });

    writeJson(publicDir, 'pokemon-data.json', pokemonList);
    writeJson(dataDir, 'parse-summary.json', {
      parseDate: new Date().toISOString(),
      totalPokemon: pokemonList.length,
      uniqueIngredients: [...new Set(pokemonList.flatMap(p =>
        Object.values(p.ingredientPatterns).flatMap(pat => pat.ingredients)
      ))].sort(),
      sampleData: pokemonList.slice(0, 3)
    });

    console.log(`✓ Total Pokemon: ${pokemonList.length}`);
    return pokemonList;
  } catch (error) {
    console.error('Error parsing wiki data:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  parseWikiData();
}
