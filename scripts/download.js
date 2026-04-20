#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

const TARGETS = {
  pokemon: {
    url: 'https://wikiwiki.jp/poke_sleep/%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3%E3%81%AE%E4%B8%80%E8%A6%A7/%E9%A3%9F%E6%9D%90%E7%8D%B2%E5%BE%97%E6%95%B0%E6%8E%A8%E5%AE%9A%E5%80%A4%E4%B8%80%E8%A6%A7/%E4%B8%80%E8%A6%A7%E8%A1%A8',
    htmlFile: 'wiki-raw.html',
    metaFile: 'wiki-metadata.json'
  },
  recipe: {
    url: 'https://wikiwiki.jp/poke_sleep/%E6%96%99%E7%90%86/%E3%83%AC%E3%82%B7%E3%83%94%E3%81%AE%E4%B8%80%E8%A6%A7',
    htmlFile: 'recipe-wiki-raw.html',
    metaFile: 'recipe-wiki-metadata.json'
  },
  ingredient: {
    url: 'https://wikiwiki.jp/poke_sleep/%E9%A3%9F%E6%9D%90/%E9%A3%9F%E6%9D%90%E3%81%AE%E4%B8%80%E8%A6%A7',
    htmlFile: 'ingredient-wiki-raw.html',
    metaFile: 'ingredient-wiki-metadata.json'
  }
};

async function download(targetName) {
  const target = TARGETS[targetName];
  if (!target) {
    console.error(`Unknown target: ${targetName}`);
    console.error(`Available: ${Object.keys(TARGETS).join(', ')}`);
    process.exit(1);
  }

  console.log(`Downloading ${targetName} wiki: ${target.url}`);

  const response = await fetch(target.url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const html = await response.text();

  fs.mkdirSync(dataDir, { recursive: true });

  const htmlPath = path.join(dataDir, target.htmlFile);
  fs.writeFileSync(htmlPath, html, 'utf8');

  const metadata = {
    url: target.url,
    downloadDate: new Date().toISOString(),
    size: html.length,
    status: response.status,
    statusText: response.statusText
  };
  fs.writeFileSync(path.join(dataDir, target.metaFile), JSON.stringify(metadata, null, 2));

  console.log(`✓ Saved ${html.length} chars to ${htmlPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const targetName = process.argv[2];
  if (!targetName) {
    console.error('Usage: node scripts/download.js <pokemon|recipe|ingredient>');
    process.exit(1);
  }
  download(targetName).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

export { download, TARGETS };
