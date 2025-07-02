#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_URL = 'https://wikiwiki.jp/poke_sleep/%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3%E3%81%AE%E4%B8%80%E8%A6%A7/%E9%A3%9F%E6%9D%90%E7%8D%B2%E5%BE%97%E6%95%B0%E6%8E%A8%E5%AE%9A%E5%80%A4%E4%B8%80%E8%A6%A7/%E4%B8%80%E8%A6%A7%E8%A1%A8';

async function downloadWikiData() {
  console.log('Pokemon Sleep Wiki Data Downloader');
  console.log('==================================');
  console.log(`Downloading from: ${WIKI_URL}`);
  
  try {
    const response = await fetch(WIKI_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // データディレクトリを作成
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // HTMLを保存
    const htmlPath = path.join(dataDir, 'wiki-raw.html');
    fs.writeFileSync(htmlPath, html, 'utf8');
    
    // メタデータを保存
    const metadata = {
      url: WIKI_URL,
      downloadDate: new Date().toISOString(),
      size: html.length,
      status: response.status,
      statusText: response.statusText
    };
    
    const metadataPath = path.join(dataDir, 'wiki-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log(`✓ HTML saved to: ${htmlPath}`);
    console.log(`✓ Metadata saved to: ${metadataPath}`);
    console.log(`✓ Downloaded ${html.length} characters`);
    console.log(`✓ Download completed at: ${metadata.downloadDate}`);
    
    return { htmlPath, metadataPath, metadata };
    
  } catch (error) {
    console.error('Error downloading wiki data:', error.message);
    process.exit(1);
  }
}

// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  downloadWikiData();
}

export { downloadWikiData };