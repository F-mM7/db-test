#!/usr/bin/env node

import * as cheerio from 'cheerio';
import process from 'process';
import { loadHtml, writeJson, dataDir, publicDir } from './lib/io.js';

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

// AAA→A、ABB→B、AAC→C を抜き出す（同じ A はパターン間で一致する前提）
function extractABC(ingredientPatterns) {
  return {
    ingredientA: ingredientPatterns.AAA?.ingredients[0]
              ?? ingredientPatterns.ABB?.ingredients[0]
              ?? ingredientPatterns.AAC?.ingredients[0]
              ?? null,
    ingredientB: ingredientPatterns.ABB?.ingredients[1] ?? null,
    ingredientC: ingredientPatterns.AAC?.ingredients[2] ?? null
  };
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

  return { id, name, ...extractABC(ingredientPatterns), ingredientPatterns };
}

function parseHtmlTable(html) {
  const $ = cheerio.load(html);
  const table = $('table').first();
  if (table.length === 0) throw new Error('No table found in HTML');

  console.log(`Processing table with ${table.find('tr').length} rows`);

  const pokemonList = [];
  let id = 1;
  let failed = 0;

  table.find('tbody tr').each((rowIndex, row) => {
    try {
      const pokemon = parsePokemonRow($, $(row).find('td'), id);
      if (pokemon) {
        pokemonList.push(pokemon);
        id++;
      } else {
        failed++;
      }
    } catch (error) {
      console.warn(`Error parsing row ${rowIndex}:`, error.message);
      failed++;
    }
  });

  console.log(`✓ Successfully parsed: ${pokemonList.length} Pokemon`);
  console.log(`✗ Failed to parse: ${failed} rows`);
  if (pokemonList.length === 0) throw new Error('No Pokemon data extracted from table');
  return pokemonList;
}

function uniqueIngredients(pokemonList) {
  const set = new Set();
  pokemonList.forEach(p => {
    Object.values(p.ingredientPatterns).forEach(pat => {
      pat.ingredients.forEach(i => set.add(i));
    });
  });
  return Array.from(set).sort();
}

export function parseWikiData() {
  console.log('Pokemon Sleep Wiki Data Parser');
  console.log('==============================');

  try {
    const html = loadHtml('wiki-raw.html', 'Please run "npm run download-wiki" first.');
    const pokemonList = parseHtmlTable(html);

    writeJson(publicDir, 'pokemon-data.json', pokemonList);
    writeJson(dataDir, 'parse-summary.json', {
      parseDate: new Date().toISOString(),
      totalPokemon: pokemonList.length,
      uniqueIngredients: uniqueIngredients(pokemonList),
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
