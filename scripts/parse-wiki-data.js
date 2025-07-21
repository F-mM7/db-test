#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseWikiData() {
  console.log('Pokemon Sleep Wiki Data Parser');
  console.log('==============================');
  
  const dataDir = path.join(__dirname, '..', 'data');
  const htmlPath = path.join(dataDir, 'wiki-raw.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.error('Error: wiki-raw.html not found!');
    console.error('Please run "npm run download-wiki" first.');
    process.exit(1);
  }
  
  try {
    const html = fs.readFileSync(htmlPath, 'utf8');
    console.log(`✓ Loaded HTML file (${html.length} characters)`);
    
    const pokemonData = parseHTMLTable(html);
    
    // JSONファイルを保存
    const outputPath = path.join(__dirname, '..', 'public', 'pokemon-data.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(pokemonData, null, 2));
    
    // パース結果のサマリーを保存
    const summary = {
      parseDate: new Date().toISOString(),
      totalPokemon: pokemonData.length,
      uniqueIngredients: extractUniqueIngredients(pokemonData),
      sampleData: pokemonData.slice(0, 3) // 最初の3件をサンプルとして保存
    };
    
    const summaryPath = path.join(dataDir, 'parse-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`✓ Pokemon data saved to: ${outputPath}`);
    console.log(`✓ Parse summary saved to: ${summaryPath}`);
    console.log(`✓ Total Pokemon: ${pokemonData.length}`);
    console.log(`✓ Unique ingredients: ${summary.uniqueIngredients.length}`);
    
    return pokemonData;
    
  } catch (error) {
    console.error('Error parsing wiki data:', error.message);
    process.exit(1);
  }
}

function parseHTMLTable(html) {
  const $ = cheerio.load(html);
  const pokemonList = [];
  let pokemonId = 1;

  console.log('Parsing HTML table...');

  // メインテーブルを特定
  const table = $('table').first();
  if (table.length === 0) {
    console.log('No table found. Using sample data...');
    return getSampleData();
  }

  console.log(`Processing table with ${table.find('tr').length} rows`);

  // データ行を処理（tbody内の行）
  const dataRows = table.find('tbody tr');
  let successfulParses = 0;
  let failedParses = 0;

  dataRows.each((rowIndex, row) => {
    try {
      const pokemon = parsePokemonRow($, $(row).find('td'), pokemonId);
      if (pokemon) {
        pokemonList.push(pokemon);
        pokemonId++;
        successfulParses++;
      } else {
        failedParses++;
      }
    } catch (error) {
      console.warn(`Error parsing row ${rowIndex}:`, error.message);
      failedParses++;
    }
  });

  console.log(`✓ Successfully parsed: ${successfulParses} Pokemon`);
  console.log(`✗ Failed to parse: ${failedParses} rows`);

  if (pokemonList.length === 0) {
    console.log('No Pokemon data extracted. Using sample data...');
    return getSampleData();
  }

  return pokemonList;
}

function parsePokemonRow($, cells, id) {
  // C食材がないポケモンは26セル、通常は34セル
  const hasC = cells.length >= 34;
  
  if (cells.length < 26) {
    console.warn(`Row has ${cells.length} cells, expected at least 26`);
    return null;
  }

  // ポケモン名を取得（セル1）
  const nameCell = $(cells[1]);
  const name = nameCell.find('a').text().trim() || nameCell.text().trim();
  
  if (!name) {
    console.warn('No Pokemon name found');
    return null;
  }

  console.log(`Parsing: ${name} (${cells.length} cells${!hasC ? ' - no C ingredient' : ''})`);

  const pokemon = {
    id,
    name,
    ingredientPatterns: {}
  };

  // Lv.1とLv.30のAAパターンデータは削除（使用されていないため）

  // Lv.30のABパターンデータは削除（使用されていないため）

  // Lv.60パターンを解析
  let lv60Patterns;
  
  if (hasC) {
    // C食材がある場合（通常）
    lv60Patterns = [
      { name: 'AAA', start: 10, cells: 2 },
      { name: 'AAC', start: 12, cells: 4 },
      { name: 'ABB', start: 20, cells: 4 }
    ];
  } else {
    // C食材がない場合（AACパターンなし）
    lv60Patterns = [
      { name: 'AAA', start: 10, cells: 2 },
      { name: 'ABB', start: 12, cells: 4 }
    ];
  }

  lv60Patterns.forEach(pattern => {
    const patternData = parseLv60Pattern($, cells, pattern);
    if (patternData) {
      pokemon.ingredientPatterns[pattern.name] = patternData;
    }
  });

  return pokemon;
}

function parseLv60Pattern($, cells, pattern) {
  const { name, start, cells: cellCount } = pattern;
  
  if (start + cellCount > cells.length) {
    return null;
  }

  if (cellCount === 2) {
    // AAAパターン（同じ食材3つ）
    const ingredient = getIngredientFromCell($, cells[start]);
    const value = parseFloat($(cells[start + 1]).text().trim());
    
    if (ingredient && !isNaN(value)) {
      return {
        ingredients: [ingredient, ingredient, ingredient],
        individualValues: { [ingredient]: value },
        totalValue: value
      };
    }
  } else if (cellCount === 4) {
    // AAC, ABBパターン
    const ingredientA = getIngredientFromCell($, cells[start]);
    const valueA = parseFloat($(cells[start + 1]).text().trim());
    const ingredientB = getIngredientFromCell($, cells[start + 2]);
    const valueB = parseFloat($(cells[start + 3]).text().trim());
    
    if (ingredientA && ingredientB && !isNaN(valueA) && !isNaN(valueB)) {
      let ingredients;
      if (name === 'AAC') {
        ingredients = [ingredientA, ingredientA, ingredientB];
      } else if (name === 'ABB') {
        ingredients = [ingredientA, ingredientB, ingredientB];
      }
      
      return {
        ingredients,
        individualValues: {
          [ingredientA]: valueA,
          [ingredientB]: valueB
        },
        totalValue: valueA + valueB
      };
    }
  }
  
  return null;
}

function getIngredientFromCell($, cell) {
  const img = $(cell).find('img');
  if (img.length > 0) {
    return img.attr('alt') || img.attr('title') || '';
  }
  return '';
}

function extractUniqueIngredients(pokemonData) {
  const ingredientSet = new Set();
  
  pokemonData.forEach(pokemon => {
    Object.values(pokemon.ingredientPatterns).forEach(pattern => {
      pattern.ingredients.forEach(ingredient => {
        ingredientSet.add(ingredient);
      });
    });
  });
  
  return Array.from(ingredientSet).sort();
}

function getSampleData() {
  return [
    {
      id: 1,
      name: "フシギダネ",
      ingredientPatterns: {
        "AAA": { ingredients: ["あまいミツ", "あまいミツ", "あまいミツ"], values: { 1: 3.2, 30: 6.8, 60: 12.3 } }
      }
    },
    {
      id: 2,
      name: "フシギソウ",
      ingredientPatterns: {
      }
    },
    {
      id: 3,
      name: "ピカチュウ",
      ingredientPatterns: {
        "AAA": { ingredients: ["リンゴ", "リンゴ", "リンゴ"], values: { 1: 4.2, 30: 8.8, 60: 15.9 } }
      }
    },
    {
      id: 4,
      name: "イーブイ",
      ingredientPatterns: {
        "ABB": { ingredients: ["モーモーミルク", "ふといながねぎ", "ふといながねぎ"], values: { 1: 3.6, 30: 7.6, 60: 13.8 } }
      }
    },
    {
      id: 5,
      name: "カビゴン",
      ingredientPatterns: {
        "AAC": { ingredients: ["きのみ", "きのみ", "ワカクサ大豆"], values: { 1: 5.0, 30: 10.6, 60: 19.2 } }
      }
    },
    {
      id: 6,
      name: "コダック",
      ingredientPatterns: {
        "AAA": { ingredients: ["カカオ", "カカオ", "カカオ"], values: { 1: 3.4, 30: 7.1, 60: 12.8 } }
      }
    }
  ];
}

// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  parseWikiData();
}

export { parseWikiData };