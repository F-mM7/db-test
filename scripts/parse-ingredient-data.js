#!/usr/bin/env node

import * as cheerio from 'cheerio';
import process from 'process';
import { loadHtml, loadJson, writeJson, dataDir, publicDir } from './lib/io.js';
import { assertCount, DATASETS } from './lib/validate.js';

const COL = {
  NAME: 1,
  BASE_ENERGY: 3,
  EFFECTIVE_ENERGY_MAX: 5,
  DREAM_SHARDS: 6
};

// ヘッダーに「基礎エナジー」を含むテーブルを選ぶ
function findIngredientTable($, tables) {
  let found = null;
  tables.each((_, table) => {
    const headerText = $(table).find('thead th').text().replace(/\s+/g, '');
    if (headerText.includes('基礎エナジー')) {
      found = table;
      return false;
    }
  });
  return found;
}

function parseIntOrNull(text) {
  const value = parseInt(text, 10);
  return Number.isNaN(value) ? null : value;
}

// 戻り値: { ing, anomalous }
//   ing       … 抽出できた食材（失敗時 null）
//   anomalous … データ行とみなせるのに抽出に失敗した場合 true（列数不足の非データ行は false）
function parseRow($, row) {
  const cells = $(row).find('td');
  if (cells.length < 4) return { ing: null, anomalous: false };

  const name = $(cells[COL.NAME]).find('a.rel-wiki-page').first().text().trim();
  if (!name) return { ing: null, anomalous: true };

  const baseEnergyText = $(cells[COL.BASE_ENERGY]).text().trim();
  const baseEnergy = parseInt(baseEnergyText, 10);
  if (Number.isNaN(baseEnergy)) {
    console.warn(`  Warning: Invalid base energy for "${name}" (raw: "${baseEnergyText}")`);
    return { ing: null, anomalous: true };
  }

  return {
    ing: {
      name,
      baseEnergy,
      effectiveEnergyMax: parseIntOrNull($(cells[COL.EFFECTIVE_ENERGY_MAX] ?? '').text().trim()),
      dreamShards: parseIntOrNull($(cells[COL.DREAM_SHARDS] ?? '').text().trim())
    },
    anomalous: false
  };
}

export function parseIngredientData() {
  console.log('Pokemon Sleep Ingredient Wiki Data Parser');
  console.log('=========================================');

  try {
    const html = loadHtml('ingredient-wiki-raw.html', 'Please run "npm run download-ingredient-wiki" first.');
    const $ = cheerio.load(html);
    const tables = $('table');
    console.log(`Found ${tables.length} tables`);

    const target = findIngredientTable($, tables);
    if (!target) throw new Error('Ingredient table (with "基礎エナジー" header) not found');

    const rows = $(target).find('tbody tr');
    console.log(`Processing ${rows.length} rows...`);

    const previous = loadJson(DATASETS.ingredient.file);
    const ingredients = [];
    let anomalous = 0;
    rows.each((_, row) => {
      const { ing, anomalous: a } = parseRow($, row);
      if (ing) ingredients.push(ing);
      else if (a) anomalous++;
    });

    // データ行とみなせるのに抽出に失敗した行があれば劣化データの兆候として中止する
    if (anomalous > 0) {
      throw new Error(`${anomalous} 行の食材データのパースに失敗しました。Wiki のテーブル構造変更が疑われます。`);
    }
    assertCount(DATASETS.ingredient.label, ingredients.length, {
      absoluteMin: DATASETS.ingredient.absoluteMin,
      previousCount: previous?.length ?? null
    });

    writeJson(publicDir, 'ingredient-data.json', ingredients);

    const sortedByBaseEnergy = [...ingredients]
      .sort((a, b) => b.baseEnergy - a.baseEnergy)
      .map(i => ({ name: i.name, baseEnergy: i.baseEnergy }));

    writeJson(dataDir, 'ingredient-parse-summary.json', {
      parseDate: new Date().toISOString(),
      totalIngredients: ingredients.length,
      sortedByBaseEnergy
    });

    console.log(`\n✓ Total ingredients: ${ingredients.length}`);
    console.log('✓ Sorted by base energy (desc):');
    sortedByBaseEnergy.forEach(i => {
      console.log(`    ${String(i.baseEnergy).padStart(4)} - ${i.name}`);
    });

    return ingredients;
  } catch (error) {
    console.error('Error parsing ingredient wiki data:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  parseIngredientData();
}
