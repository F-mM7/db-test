#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_URL = 'https://wikiwiki.jp/poke_sleep/%E9%A3%9F%E6%9D%90/%E9%A3%9F%E6%9D%90%E3%81%AE%E4%B8%80%E8%A6%A7';

async function downloadIngredientWikiData() {
  console.log('Pokemon Sleep Ingredient Wiki Data Downloader');
  console.log('=============================================');
  console.log(`Downloading from: ${WIKI_URL}`);

  try {
    const response = await fetch(WIKI_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const htmlPath = path.join(dataDir, 'ingredient-wiki-raw.html');
    fs.writeFileSync(htmlPath, html, 'utf8');

    const metadata = {
      url: WIKI_URL,
      downloadDate: new Date().toISOString(),
      size: html.length,
      status: response.status,
      statusText: response.statusText
    };

    const metadataPath = path.join(dataDir, 'ingredient-wiki-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`✓ HTML saved to: ${htmlPath}`);
    console.log(`✓ Metadata saved to: ${metadataPath}`);
    console.log(`✓ Downloaded ${html.length} characters`);
    console.log(`✓ Download completed at: ${metadata.downloadDate}`);

    return { htmlPath, metadataPath, metadata };

  } catch (error) {
    console.error('Error downloading ingredient wiki data:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  downloadIngredientWikiData();
}

export { downloadIngredientWikiData };
