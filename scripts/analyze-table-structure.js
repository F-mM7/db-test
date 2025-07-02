#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function analyzeTableStructure() {
  console.log('Table Structure Analyzer');
  console.log('========================');
  
  const dataDir = path.join(__dirname, '..', 'data');
  const htmlPath = path.join(dataDir, 'wiki-raw.html');
  
  if (!fs.existsSync(htmlPath)) {
    console.error('Error: wiki-raw.html not found!');
    console.error('Please run "npm run download-wiki" first.');
    process.exit(1);
  }
  
  const html = fs.readFileSync(htmlPath, 'utf8');
  const $ = cheerio.load(html);
  
  // テーブルを見つける
  const table = $('table').first();
  console.log(`Found table with ${table.find('tr').length} rows`);
  
  // ヘッダー構造を解析
  console.log('\n=== HEADER STRUCTURE ===');
  const headerRows = table.find('thead tr');
  headerRows.each((i, row) => {
    console.log(`\nHeader Row ${i + 1}:`);
    $(row).find('th, td').each((j, cell) => {
      const $cell = $(cell);
      const text = $cell.text().trim();
      const colspan = $cell.attr('colspan') || '1';
      const rowspan = $cell.attr('rowspan') || '1';
      console.log(`  [${j}] "${text}" (colspan=${colspan}, rowspan=${rowspan})`);
    });
  });
  
  // データ行の構造を解析
  console.log('\n=== DATA ROWS STRUCTURE ===');
  const dataRows = table.find('tbody tr').slice(0, 3); // 最初の3行
  dataRows.each((i, row) => {
    console.log(`\nData Row ${i + 1}:`);
    const cells = $(row).find('td');
    console.log(`  Total cells: ${cells.length}`);
    
    cells.each((j, cell) => {
      const $cell = $(cell);
      const text = $cell.text().trim();
      
      // 画像のalt属性も取得
      const img = $cell.find('img');
      const imgAlt = img.length > 0 ? img.attr('alt') : '';
      
      // リンクも取得
      const link = $cell.find('a');
      const linkText = link.length > 0 ? link.text().trim() : '';
      
      console.log(`  [${j}] Text: "${text}" | ImgAlt: "${imgAlt}" | Link: "${linkText}"`);
    });
  });
  
  // カラム分析
  console.log('\n=== COLUMN ANALYSIS ===');
  console.log('Based on the header structure, columns are:');
  console.log('0: Pokemon Icon');
  console.log('1: Pokemon Name');
  console.log('2-3: Lv.1 (Icon, Value)');
  console.log('4-9: Lv.30 AA Pattern (Icon, Value, A-Icon, A-Value, B-Icon, B-Value)');
  console.log('10+: Lv.60 various patterns...');
  
  // パターン解析
  console.log('\n=== PATTERN POSITIONS ===');
  const patterns = [
    { name: 'Lv1', start: 2, cells: 2 },
    { name: 'Lv30-AA', start: 4, cells: 2 },
    { name: 'Lv30-AB', start: 6, cells: 4 }, // A icon, A value, B icon, B value
    { name: 'Lv60-AAA', start: 10, cells: 2 },
    { name: 'Lv60-AAB', start: 12, cells: 4 },
    { name: 'Lv60-AAC', start: 16, cells: 4 },
    { name: 'Lv60-ABA', start: 20, cells: 4 },
    { name: 'Lv60-ABB', start: 24, cells: 4 },
    { name: 'Lv60-ABC', start: 28, cells: 6 } // A, A-val, B, B-val, C, C-val
  ];
  
  patterns.forEach(pattern => {
    console.log(`${pattern.name}: cells ${pattern.start}-${pattern.start + pattern.cells - 1}`);
  });
}

analyzeTableStructure();