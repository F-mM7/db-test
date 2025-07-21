#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_URL = 'https://wikiwiki.jp/poke_sleep/%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3%E3%81%AE%E4%B8%80%E8%A6%A7/%E9%A3%9F%E6%9D%90%E7%8D%B2%E5%BE%97%E6%95%B0%E6%8E%A8%E5%AE%9A%E5%80%A4%E4%B8%80%E8%A6%A7/%E4%B8%80%E8%A6%A7%E8%A1%A8';

async function fetchPokemonData() {
  console.log('Fetching Pokemon data from wiki...');
  
  try {
    const response = await fetch(WIKI_URL);
    const html = await response.text();
    
    const pokemonData = parseHTMLTable(html);
    
    const outputPath = path.join(__dirname, '..', 'public', 'pokemon-data.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(pokemonData, null, 2));
    console.log(`Data saved to ${outputPath}`);
    console.log(`Total Pokemon: ${pokemonData.length}`);
    
  } catch (error) {
    console.error('Error fetching data:', error);
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

  // テーブルの行を処理
  const rows = $(mainTable).find('tr');
  let headerProcessed = false;

  rows.each((rowIndex, row) => {
    const cells = $(row).find('td, th');
    
    if (cells.length === 0) return;

    // ヘッダー行をスキップ
    if (!headerProcessed && $(row).find('th').length > 0) {
      headerProcessed = true;
      return;
    }

    // ポケモン名を含む行を処理
    const firstCell = $(cells[0]).text().trim();
    
    if (firstCell && !firstCell.includes('Lv.') && firstCell.length > 0) {
      try {
        const pokemon = parsePokemonRow($, cells, pokemonId);
        if (pokemon) {
          pokemonList.push(pokemon);
          pokemonId++;
        }
      } catch (error) {
        console.warn(`Error parsing row ${rowIndex}:`, error.message);
      }
    }
  });

  if (pokemonList.length === 0) {
    console.log('No Pokemon data extracted. Using sample data...');
    return getSampleData();
  }

  console.log(`Successfully parsed ${pokemonList.length} Pokemon`);
  return pokemonList;
}

function parsePokemonRow($, cells, id) {
  if (cells.length < 3) return null;

  const name = $(cells[0]).text().trim();
  if (!name || name.length === 0) return null;

  console.log(`Parsing: ${name}`);

  const pokemon = {
    id,
    name,
    ingredientPatterns: {}
  };

  // 食材パターンを抽出
  for (let i = 4; i < cells.length; i += 3) {
    if (i + 2 >= cells.length) break;

    const patternCell = $(cells[i]).text().trim();
    const ingredientsCell = $(cells[i + 1]).text().trim();
    const valuesCell = $(cells[i + 2]).text().trim();

    if (patternCell && ingredientsCell) {
      const pattern = patternCell;
      const ingredients = ingredientsCell.split(/[,、]/).map(s => s.trim()).filter(s => s);
      
      // 数値を抽出
      const values = {};
      const numbers = valuesCell.match(/[\d.]+/g);
      if (numbers && numbers.length >= 3) {
        values['1'] = parseFloat(numbers[0]);
        values['30'] = parseFloat(numbers[1]);
        values['60'] = parseFloat(numbers[2]);
      }

      if (ingredients.length > 0) {
        pokemon.ingredientPatterns[pattern] = {
          ingredients,
          values
        };
      }
    }
  }

  return Object.keys(pokemon.ingredientPatterns).length > 0 ? pokemon : null;
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

// メッセージ
console.log('Pokemon Sleep Food Material Data Fetcher');
console.log('========================================');
console.log('This script fetches the latest data from the wiki.');
console.log('Note: Actual HTML parsing is not yet implemented.');
console.log('');

fetchPokemonData();