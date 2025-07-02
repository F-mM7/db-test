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
  if (cells.length < 34) {
    console.warn(`Row has ${cells.length} cells, expected 34`);
    return null;
  }

  // ポケモン名を取得（セル1）
  const nameCell = $(cells[1]);
  const name = nameCell.find('a').text().trim() || nameCell.text().trim();
  
  if (!name) {
    console.warn('No Pokemon name found');
    return null;
  }

  console.log(`Parsing: ${name}`);

  const pokemon = {
    id,
    name,
    levels: {},
    ingredientPatterns: {}
  };

  // Lv.1データ（セル2-3: 食材アイコン, 数値）
  const lv1Ingredient = getIngredientFromCell($, cells[2]);
  const lv1Value = parseFloat($(cells[3]).text().trim());
  
  if (lv1Ingredient && !isNaN(lv1Value)) {
    pokemon.levels['1'] = { value: lv1Value };
    pokemon.ingredientPatterns['AA'] = {
      ingredients: [lv1Ingredient, lv1Ingredient],
      individualValues: { [lv1Ingredient]: lv1Value },
      totalValue: lv1Value
    };
  }

  // Lv.30 AAパターン（セル4-5: 食材アイコン, 数値）
  const lv30Ingredient = getIngredientFromCell($, cells[4]);
  const lv30Value = parseFloat($(cells[5]).text().trim());
  
  if (lv30Ingredient && !isNaN(lv30Value)) {
    pokemon.levels['30'] = { value: lv30Value };
    if (pokemon.ingredientPatterns['AA']) {
      pokemon.ingredientPatterns['AA'].individualValues[lv30Ingredient] = lv30Value;
      pokemon.ingredientPatterns['AA'].totalValue = lv30Value;
    }
  }

  // Lv.30 ABパターン（セル6-9: A食材, A数値, B食材, B数値）
  const lv30AIngredient = getIngredientFromCell($, cells[6]);
  const lv30AValue = parseFloat($(cells[7]).text().trim());
  const lv30BIngredient = getIngredientFromCell($, cells[8]);
  const lv30BValue = parseFloat($(cells[9]).text().trim());
  
  if (lv30AIngredient && lv30BIngredient && !isNaN(lv30AValue) && !isNaN(lv30BValue)) {
    pokemon.ingredientPatterns['AB'] = {
      ingredients: [lv30AIngredient, lv30BIngredient],
      individualValues: {
        [lv30AIngredient]: lv30AValue,
        [lv30BIngredient]: lv30BValue
      },
      totalValue: lv30AValue + lv30BValue
    };
  }

  // Lv.60パターンを解析
  const lv60Patterns = [
    { name: 'AAA', start: 10, cells: 2 },
    { name: 'AAB', start: 12, cells: 4 },
    { name: 'AAC', start: 16, cells: 4 },
    { name: 'ABA', start: 20, cells: 4 },
    { name: 'ABB', start: 24, cells: 4 },
    { name: 'ABC', start: 28, cells: 6 }
  ];

  lv60Patterns.forEach(pattern => {
    const patternData = parseLv60Pattern($, cells, pattern);
    if (patternData) {
      pokemon.ingredientPatterns[pattern.name] = patternData;
      
      // Lv.60の基本値をAAAパターンから設定
      if (pattern.name === 'AAA' && patternData.totalValue) {
        pokemon.levels['60'] = { value: patternData.totalValue };
      }
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
    // AAB, AAC, ABA, ABBパターン
    const ingredientA = getIngredientFromCell($, cells[start]);
    const valueA = parseFloat($(cells[start + 1]).text().trim());
    const ingredientB = getIngredientFromCell($, cells[start + 2]);
    const valueB = parseFloat($(cells[start + 3]).text().trim());
    
    if (ingredientA && ingredientB && !isNaN(valueA) && !isNaN(valueB)) {
      let ingredients;
      if (name === 'AAB' || name === 'AAC') {
        ingredients = [ingredientA, ingredientA, ingredientB];
      } else if (name === 'ABA') {
        ingredients = [ingredientA, ingredientB, ingredientA];
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
  } else if (cellCount === 6) {
    // ABCパターン
    const ingredientA = getIngredientFromCell($, cells[start]);
    const valueA = parseFloat($(cells[start + 1]).text().trim());
    const ingredientB = getIngredientFromCell($, cells[start + 2]);
    const valueB = parseFloat($(cells[start + 3]).text().trim());
    const ingredientC = getIngredientFromCell($, cells[start + 4]);
    const valueC = parseFloat($(cells[start + 5]).text().trim());
    
    if (ingredientA && ingredientB && ingredientC && 
        !isNaN(valueA) && !isNaN(valueB) && !isNaN(valueC)) {
      return {
        ingredients: [ingredientA, ingredientB, ingredientC],
        individualValues: {
          [ingredientA]: valueA,
          [ingredientB]: valueB,
          [ingredientC]: valueC
        },
        totalValue: valueA + valueB + valueC
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
      levels: {
        1: { value: 1.5 },
        30: { value: 3.2 },
        60: { value: 5.8 }
      },
      ingredientPatterns: {
        "AA": { ingredients: ["あまいミツ", "あまいミツ"], values: { 1: 2.1, 30: 4.5, 60: 8.2 } },
        "AB": { ingredients: ["あまいミツ", "あんみんトマト"], values: { 1: 1.8, 30: 3.9, 60: 7.1 } },
        "AAA": { ingredients: ["あまいミツ", "あまいミツ", "あまいミツ"], values: { 1: 3.2, 30: 6.8, 60: 12.3 } }
      }
    },
    {
      id: 2,
      name: "フシギソウ",
      levels: {
        1: { value: 1.7 },
        30: { value: 3.6 },
        60: { value: 6.5 }
      },
      ingredientPatterns: {
        "AA": { ingredients: ["あまいミツ", "あまいミツ"], values: { 1: 2.4, 30: 5.0, 60: 9.1 } },
        "AB": { ingredients: ["あまいミツ", "あんみんトマト"], values: { 1: 2.0, 30: 4.3, 60: 7.8 } }
      }
    },
    {
      id: 3,
      name: "ピカチュウ",
      levels: {
        1: { value: 2.0 },
        30: { value: 4.2 },
        60: { value: 7.6 }
      },
      ingredientPatterns: {
        "AA": { ingredients: ["リンゴ", "リンゴ"], values: { 1: 2.8, 30: 5.9, 60: 10.6 } },
        "AB": { ingredients: ["リンゴ", "ワカクサコーン"], values: { 1: 2.4, 30: 5.0, 60: 9.1 } },
        "AAA": { ingredients: ["リンゴ", "リンゴ", "リンゴ"], values: { 1: 4.2, 30: 8.8, 60: 15.9 } }
      }
    },
    {
      id: 4,
      name: "イーブイ",
      levels: {
        1: { value: 1.8 },
        30: { value: 3.8 },
        60: { value: 6.9 }
      },
      ingredientPatterns: {
        "AA": { ingredients: ["モーモーミルク", "モーモーミルク"], values: { 1: 2.5, 30: 5.3, 60: 9.7 } },
        "AB": { ingredients: ["モーモーミルク", "ふといながねぎ"], values: { 1: 2.2, 30: 4.6, 60: 8.3 } },
        "AAB": { ingredients: ["モーモーミルク", "モーモーミルク", "ふといながねぎ"], values: { 1: 3.6, 30: 7.6, 60: 13.8 } }
      }
    },
    {
      id: 5,
      name: "カビゴン",
      levels: {
        1: { value: 2.5 },
        30: { value: 5.3 },
        60: { value: 9.6 }
      },
      ingredientPatterns: {
        "AA": { ingredients: ["きのみ", "きのみ"], values: { 1: 3.5, 30: 7.4, 60: 13.4 } },
        "AB": { ingredients: ["きのみ", "ワカクサ大豆"], values: { 1: 3.0, 30: 6.4, 60: 11.5 } },
        "ABC": { ingredients: ["きのみ", "ワカクサ大豆", "おいしいシッポ"], values: { 1: 5.0, 30: 10.6, 60: 19.2 } }
      }
    },
    {
      id: 6,
      name: "コダック",
      levels: {
        1: { value: 1.6 },
        30: { value: 3.4 },
        60: { value: 6.1 }
      },
      ingredientPatterns: {
        "AA": { ingredients: ["カカオ", "カカオ"], values: { 1: 2.2, 30: 4.8, 60: 8.5 } },
        "AB": { ingredients: ["カカオ", "リラックスカカオ"], values: { 1: 1.9, 30: 4.1, 60: 7.3 } },
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