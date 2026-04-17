#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// テーブル列インデックス
const COL = {
  IMAGE: 0,
  NAME: 1,
  DESCRIPTION: 2,
  BASE_ENERGY: 3,
  BONUS_MAX: 4,
  EFFECTIVE_ENERGY_MAX: 5,
  DREAM_SHARDS: 6
};

class IngredientWikiParser {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.htmlPath = path.join(this.dataDir, 'ingredient-wiki-raw.html');
    this.outputPath = path.join(__dirname, '..', 'public', 'ingredient-data.json');
    this.summaryPath = path.join(this.dataDir, 'ingredient-parse-summary.json');
  }

  validateInputFile() {
    if (!fs.existsSync(this.htmlPath)) {
      console.error('Error: ingredient-wiki-raw.html not found!');
      console.error('Please run "npm run download-ingredient-wiki" first.');
      process.exit(1);
    }
  }

  loadHTML() {
    const html = fs.readFileSync(this.htmlPath, 'utf8');
    console.log(`✓ Loaded HTML file (${html.length} characters)`);
    return html;
  }

  // ヘッダーに「基礎エナジー」を含むテーブルを探す（<br> を除いて文字列連結）
  findIngredientTable($, tables) {
    let foundTable = null;
    tables.each((_, table) => {
      const headerText = $(table).find('thead th').text().replace(/\s+/g, '');
      if (headerText.includes('基礎エナジー')) {
        foundTable = table;
        return false;
      }
      return undefined;
    });
    return foundTable;
  }

  parseRow($, row) {
    const cells = $(row).find('td');
    if (cells.length < 4) return null;

    const nameLink = $(cells[COL.NAME]).find('a.rel-wiki-page').first();
    const name = nameLink.text().trim();
    if (!name) return null;

    const baseEnergyText = $(cells[COL.BASE_ENERGY]).text().trim();
    const baseEnergy = parseInt(baseEnergyText, 10);
    if (Number.isNaN(baseEnergy)) {
      console.warn(`  Warning: Invalid base energy for "${name}" (raw: "${baseEnergyText}")`);
      return null;
    }

    const effectiveEnergyMaxText = cells.length > COL.EFFECTIVE_ENERGY_MAX
      ? $(cells[COL.EFFECTIVE_ENERGY_MAX]).text().trim()
      : '';
    const effectiveEnergyMax = parseInt(effectiveEnergyMaxText, 10);

    const dreamShardsText = cells.length > COL.DREAM_SHARDS
      ? $(cells[COL.DREAM_SHARDS]).text().trim()
      : '';
    const dreamShards = parseInt(dreamShardsText, 10);

    return {
      name,
      baseEnergy,
      effectiveEnergyMax: Number.isNaN(effectiveEnergyMax) ? null : effectiveEnergyMax,
      dreamShards: Number.isNaN(dreamShards) ? null : dreamShards
    };
  }

  parse() {
    console.log('Pokemon Sleep Ingredient Wiki Data Parser');
    console.log('=========================================');

    try {
      this.validateInputFile();
      const html = this.loadHTML();
      const $ = cheerio.load(html);
      const tables = $('table');

      console.log(`Found ${tables.length} tables`);

      const targetTable = this.findIngredientTable($, tables);
      if (!targetTable) {
        throw new Error('Ingredient table (with "基礎エナジー" header) not found');
      }

      const rows = $(targetTable).find('tbody tr');
      console.log(`Processing ${rows.length} rows...`);

      const ingredients = [];
      rows.each((_, row) => {
        const ing = this.parseRow($, row);
        if (ing) ingredients.push(ing);
      });

      this.saveResults(ingredients);
      return ingredients;
    } catch (error) {
      console.error('Error parsing ingredient wiki data:', error.message);
      process.exit(1);
    }
  }

  saveResults(ingredients) {
    const outputDir = path.dirname(this.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(this.outputPath, JSON.stringify(ingredients, null, 2));

    const summary = {
      parseDate: new Date().toISOString(),
      totalIngredients: ingredients.length,
      sortedByBaseEnergy: [...ingredients]
        .sort((a, b) => b.baseEnergy - a.baseEnergy)
        .map(i => ({ name: i.name, baseEnergy: i.baseEnergy }))
    };
    fs.writeFileSync(this.summaryPath, JSON.stringify(summary, null, 2));

    console.log(`\n✓ Ingredient data saved to: ${this.outputPath}`);
    console.log(`✓ Parse summary saved to: ${this.summaryPath}`);
    console.log(`✓ Total ingredients: ${ingredients.length}`);
    console.log(`✓ Sorted by base energy (desc):`);
    summary.sortedByBaseEnergy.forEach(i => {
      console.log(`    ${String(i.baseEnergy).padStart(4)} - ${i.name}`);
    });
  }
}

function parseIngredientData() {
  const parser = new IngredientWikiParser();
  return parser.parse();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  parseIngredientData();
}

export { parseIngredientData, IngredientWikiParser };
