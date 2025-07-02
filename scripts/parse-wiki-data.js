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

  // テーブルを探す
  const tables = $('table');
  console.log(`Found ${tables.length} tables`);

  if (tables.length === 0) {
    console.log('No tables found. Using sample data...');
    return getSampleData();
  }

  // メインテーブルを特定（最大の行数を持つテーブル）
  let mainTable = null;
  let maxRows = 0;

  tables.each((i, table) => {
    const rows = $(table).find('tr').length;
    console.log(`Table ${i + 1}: ${rows} rows`);
    if (rows > maxRows) {
      maxRows = rows;
      mainTable = table;
    }
  });

  if (!mainTable) {
    console.log('Could not identify main table. Using sample data...');
    return getSampleData();
  }

  console.log(`Processing main table with ${maxRows} rows`);

  // テーブルの構造を分析
  const headerRow = $(mainTable).find('tr').first();
  const headers = [];
  headerRow.find('th, td').each((i, cell) => {
    headers.push($(cell).text().trim());
  });
  
  console.log('Table headers:', headers);

  // テーブルの行を処理
  const rows = $(mainTable).find('tr');
  let successfulParses = 0;
  let failedParses = 0;

  rows.each((rowIndex, row) => {
    const cells = $(row).find('td, th');
    
    if (cells.length === 0) return;

    // ヘッダー行をスキップ
    if ($(row).find('th').length > 0) {
      return;
    }

    // ポケモン名を含む行を処理
    const firstCell = $(cells[0]).text().trim();
    
    if (firstCell && firstCell.length > 0 && !firstCell.includes('Lv.')) {
      try {
        const pokemon = parsePokemonRow($, cells, pokemonId, headers);
        if (pokemon) {
          pokemonList.push(pokemon);
          pokemonId++;
          successfulParses++;
        } else {
          failedParses++;
        }
      } catch (error) {
        console.warn(`Error parsing row ${rowIndex} (${firstCell}):`, error.message);
        failedParses++;
      }
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

function parsePokemonRow($, cells, id, headers) {
  if (cells.length < 3) return null;

  const name = $(cells[0]).text().trim();
  if (!name || name.length === 0) return null;

  console.log(`Parsing: ${name}`);

  const pokemon = {
    id,
    name,
    levels: {},
    ingredientPatterns: {}
  };

  // セルの内容をデバッグ出力
  const cellContents = [];
  cells.each((i, cell) => {
    cellContents.push($(cell).text().trim());
  });
  console.log(`  Cells: [${cellContents.join(', ')}]`);

  // レベル情報を抽出（推測で位置を特定）
  for (let i = 1; i < Math.min(4, cells.length); i++) {
    const cellText = $(cells[i]).text().trim();
    const value = parseFloat(cellText);
    if (!isNaN(value) && value > 0) {
      const level = i === 1 ? '1' : i === 2 ? '30' : '60';
      pokemon.levels[level] = { value };
    }
  }

  // 残りのセルから食材パターンを抽出
  let patternIndex = 0;
  const patternNames = ['AA', 'AB', 'AAA', 'AAB', 'AAC', 'ABA', 'ABB', 'ABC'];
  
  for (let i = 4; i < cells.length; i++) {
    const cellText = $(cells[i]).text().trim();
    
    // パターン名っぽい場合
    if (patternNames.includes(cellText)) {
      const pattern = cellText;
      
      // 次のセルで食材を探す
      if (i + 1 < cells.length) {
        const ingredientsText = $(cells[i + 1]).text().trim();
        if (ingredientsText && !patternNames.includes(ingredientsText)) {
          const ingredients = ingredientsText.split(/[,、]/).map(s => s.trim()).filter(s => s);
          
          if (ingredients.length > 0) {
            pokemon.ingredientPatterns[pattern] = {
              ingredients,
              values: {} // 値は別途処理が必要
            };
          }
        }
      }
    }
  }

  return Object.keys(pokemon.ingredientPatterns).length > 0 ? pokemon : null;
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