#!/usr/bin/env node

import * as cheerio from 'cheerio';
import process from 'process';
import { loadHtml, writeJson, dataDir, publicDir } from './lib/io.js';

const CATEGORY_TABLE_MAP = [
  { tableIndex: 2, category: 'カレー・シチュー' },
  { tableIndex: 3, category: 'サラダ' },
  { tableIndex: 4, category: 'デザート・ドリンク' }
];

function parseIngredients($, cell) {
  const links = $(cell).find('a.rel-wiki-page');
  if (links.length === 0) return [];

  const fullText = $(cell).text().trim();
  const ingredients = [];

  links.each((_, link) => {
    const name = $(link).text().trim();
    if (!name) return;

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = fullText.match(new RegExp(escapedName + '×(\\d+)'));
    if (match) {
      ingredients.push({ name, quantity: parseInt(match[1], 10) });
    }
  });

  return ingredients;
}

function parseTable($, table, category) {
  const recipes = [];
  $(table).find('tr').slice(1).each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 4) return;

    // 「ごちゃまぜ」行は番号セルが "-" なのでスキップ
    if ($(cells[0]).text().trim() === '-') return;

    const name = $(cells[2]).text().trim();
    if (!name) return;

    const ingredients = parseIngredients($, cells[3]);
    if (ingredients.length === 0) {
      console.warn(`  Warning: No ingredients found for "${name}"`);
      return;
    }

    const totalIngredients = parseInt($(cells[4]).text().trim(), 10) || 0;
    const energy = parseInt($(cells[5]).text().trim(), 10) || 0;

    recipes.push({ name, category, ingredients, totalIngredients, energy });
  });
  return recipes;
}

function uniqueIngredients(recipes) {
  const set = new Set();
  recipes.forEach(r => r.ingredients.forEach(i => set.add(i.name)));
  return Array.from(set).sort();
}

export function parseRecipeData() {
  console.log('Pokemon Sleep Recipe Wiki Data Parser');
  console.log('=====================================');

  try {
    const html = loadHtml('recipe-wiki-raw.html', 'Please run "npm run download-recipe-wiki" first.');
    const $ = cheerio.load(html);
    const tables = $('table');
    console.log(`Found ${tables.length} tables`);

    const allRecipes = [];
    for (const { tableIndex, category } of CATEGORY_TABLE_MAP) {
      const table = tables.eq(tableIndex);
      if (table.length === 0) {
        console.warn(`Warning: Table ${tableIndex} not found for ${category}`);
        continue;
      }
      console.log(`\nParsing ${category}...`);
      const recipes = parseTable($, table, category);
      console.log(`  ✓ Found ${recipes.length} recipes`);
      allRecipes.push(...recipes);
    }

    writeJson(publicDir, 'recipe-data.json', allRecipes);

    const byCategory = {};
    for (const { category } of CATEGORY_TABLE_MAP) {
      byCategory[category] = allRecipes.filter(r => r.category === category).length;
    }
    writeJson(dataDir, 'recipe-parse-summary.json', {
      parseDate: new Date().toISOString(),
      totalRecipes: allRecipes.length,
      byCategory,
      uniqueIngredients: uniqueIngredients(allRecipes),
      sampleData: allRecipes.slice(0, 3)
    });

    console.log(`\n✓ Total recipes: ${allRecipes.length}`);
    for (const [cat, count] of Object.entries(byCategory)) {
      console.log(`    ${cat}: ${count}`);
    }
    return allRecipes;
  } catch (error) {
    console.error('Error parsing recipe wiki data:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  parseRecipeData();
}
