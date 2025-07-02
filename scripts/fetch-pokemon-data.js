#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  const pokemonList = [];
  
  // サンプルデータ（実際のパース処理は複雑なので、まずは構造を定義）
  const sampleData = [
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
  
  // TODO: 実際のHTMLパース処理を実装
  console.log('Note: Using sample data. Actual HTML parsing needs to be implemented.');
  
  return sampleData;
}

// メッセージ
console.log('Pokemon Sleep Food Material Data Fetcher');
console.log('========================================');
console.log('This script fetches the latest data from the wiki.');
console.log('Note: Actual HTML parsing is not yet implemented.');
console.log('');

fetchPokemonData();