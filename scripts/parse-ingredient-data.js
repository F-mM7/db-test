#!/usr/bin/env node

import * as cheerio from 'cheerio';
import process from 'process';
import { loadHtml, writeJson, dataDir, publicDir } from './lib/io.js';

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

function parseRow($, row) {
  const cells = $(row).find('td');
  if (cells.length < 4) return null;

  const name = $(cells[COL.NAME]).find('a.rel-wiki-page').first().text().trim();
  if (!name) return null;

  const baseEnergyText = $(cells[COL.BASE_ENERGY]).text().trim();
  const baseEnergy = parseInt(baseEnergyText, 10);
  if (Number.isNaN(baseEnergy)) {
    console.warn(`  Warning: Invalid base energy for "${name}" (raw: "${baseEnergyText}")`);
    return null;
  }

  return {
    name,
    baseEnergy,
    effectiveEnergyMax: parseIntOrNull($(cells[COL.EFFECTIVE_ENERGY_MAX] ?? '').text().trim()),
    dreamShards: parseIntOrNull($(cells[COL.DREAM_SHARDS] ?? '').text().trim())
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

    const ingredients = [];
    rows.each((_, row) => {
      const ing = parseRow($, row);
      if (ing) ingredients.push(ing);
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
