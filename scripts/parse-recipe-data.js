#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// カテゴリとテーブルインデックスのマッピング
const CATEGORY_TABLE_MAP = [
  { tableIndex: 2, category: 'カレー・シチュー' },
  { tableIndex: 3, category: 'サラダ' },
  { tableIndex: 4, category: 'デザート・ドリンク' }
];

class RecipeWikiParser {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.htmlPath = path.join(this.dataDir, 'recipe-wiki-raw.html');
    this.outputPath = path.join(__dirname, '..', 'public', 'recipe-data.json');
    this.summaryPath = path.join(this.dataDir, 'recipe-parse-summary.json');
  }

  validateInputFile() {
    if (!fs.existsSync(this.htmlPath)) {
      console.error('Error: recipe-wiki-raw.html not found!');
      console.error('Please run "npm run download-recipe-wiki" first.');
      process.exit(1);
    }
  }

  loadHTML() {
    const html = fs.readFileSync(this.htmlPath, 'utf8');
    console.log(`✓ Loaded HTML file (${html.length} characters)`);
    return html;
  }

  parseIngredients($, cell) {
    const ingredients = [];
    const links = $(cell).find('a.rel-wiki-page');

    if (links.length === 0) {
      return ingredients;
    }

    // Get the full text to extract quantities
    const fullText = $(cell).text().trim();

    links.each((_, link) => {
      const name = $(link).text().trim();
      if (!name) return;

      // Find "食材名×数量" pattern in the full text
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedName + '×(\\d+)');
      const match = fullText.match(regex);

      if (match) {
        ingredients.push({
          name,
          quantity: parseInt(match[1], 10)
        });
      }
    });

    return ingredients;
  }

  parseTable($, table, category) {
    const recipes = [];
    const rows = $(table).find('tr');

    // Skip header row (index 0) and "ごちゃまぜ" row (index 1, has "-" in first cell)
    rows.slice(1).each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 4) return;

      const numberCell = $(cells[0]).text().trim();
      // Skip the "ごちゃまぜ" row (number is "-")
      if (numberCell === '-') return;

      const recipeName = $(cells[2]).text().trim();
      if (!recipeName) return;

      const ingredients = this.parseIngredients($, cells[3]);
      if (ingredients.length === 0) {
        console.warn(`  Warning: No ingredients found for "${recipeName}"`);
        return;
      }

      // 食材合計数（計）とエナジーを取得
      const totalIngredients = parseInt($(cells[4]).text().trim(), 10) || 0;
      const energy = parseInt($(cells[5]).text().trim(), 10) || 0;

      recipes.push({
        name: recipeName,
        category,
        ingredients,
        totalIngredients,
        energy
      });
    });

    return recipes;
  }

  parse() {
    console.log('Pokemon Sleep Recipe Wiki Data Parser');
    console.log('=====================================');

    try {
      this.validateInputFile();
      const html = this.loadHTML();
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
        const recipes = this.parseTable($, table, category);
        console.log(`  ✓ Found ${recipes.length} recipes`);
        allRecipes.push(...recipes);
      }

      this.saveResults(allRecipes);
      return allRecipes;
    } catch (error) {
      console.error('Error parsing recipe wiki data:', error.message);
      process.exit(1);
    }
  }

  saveResults(recipes) {
    // JSONファイルを保存
    const outputDir = path.dirname(this.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(this.outputPath, JSON.stringify(recipes, null, 2));

    // サマリーを保存
    const summary = {
      parseDate: new Date().toISOString(),
      totalRecipes: recipes.length,
      byCategory: {},
      uniqueIngredients: this.extractUniqueIngredients(recipes),
      sampleData: recipes.slice(0, 3)
    };

    for (const { category } of CATEGORY_TABLE_MAP) {
      summary.byCategory[category] = recipes.filter(r => r.category === category).length;
    }

    fs.writeFileSync(this.summaryPath, JSON.stringify(summary, null, 2));

    console.log(`\n✓ Recipe data saved to: ${this.outputPath}`);
    console.log(`✓ Parse summary saved to: ${this.summaryPath}`);
    console.log(`✓ Total recipes: ${recipes.length}`);
    console.log(`✓ By category:`);
    for (const [cat, count] of Object.entries(summary.byCategory)) {
      console.log(`    ${cat}: ${count}`);
    }
    console.log(`✓ Unique ingredients: ${summary.uniqueIngredients.length}`);
  }

  extractUniqueIngredients(recipes) {
    const ingredientSet = new Set();
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => ingredientSet.add(ing.name));
    });
    return Array.from(ingredientSet).sort();
  }
}

function parseRecipeData() {
  const parser = new RecipeWikiParser();
  return parser.parse();
}

// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  parseRecipeData();
}

export { parseRecipeData, RecipeWikiParser };
