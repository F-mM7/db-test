#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import { Buffer } from 'buffer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

// minBytes / marker は取得した本文が「実データページ」であることの簡易検証用。
// minBytes は各ページの実サイズ（ポケモン ~1.6MB / 料理 ~360KB / 食材 ~163KB）に
// 対して十分小さいバイト数の下限で、エラーページ・空ページ・途中切断を検知する。
// marker は各ページに固有の文字列で、想定外のページ（404/メンテ等）取得を検知する。
const TARGETS = {
  pokemon: {
    url: 'https://wikiwiki.jp/poke_sleep/%E3%83%9D%E3%82%B1%E3%83%A2%E3%83%B3%E3%81%AE%E4%B8%80%E8%A6%A7/%E9%A3%9F%E6%9D%90%E7%8D%B2%E5%BE%97%E6%95%B0%E6%8E%A8%E5%AE%9A%E5%80%A4%E4%B8%80%E8%A6%A7/%E4%B8%80%E8%A6%A7%E8%A1%A8',
    htmlFile: 'wiki-raw.html',
    metaFile: 'wiki-metadata.json',
    minBytes: 500_000,
    marker: 'フシギダネ'
  },
  recipe: {
    url: 'https://wikiwiki.jp/poke_sleep/%E6%96%99%E7%90%86/%E3%83%AC%E3%82%B7%E3%83%94%E3%81%AE%E4%B8%80%E8%A6%A7',
    htmlFile: 'recipe-wiki-raw.html',
    metaFile: 'recipe-wiki-metadata.json',
    minBytes: 100_000,
    marker: 'カレー・シチュー'
  },
  ingredient: {
    url: 'https://wikiwiki.jp/poke_sleep/%E9%A3%9F%E6%9D%90/%E9%A3%9F%E6%9D%90%E3%81%AE%E4%B8%80%E8%A6%A7',
    htmlFile: 'ingredient-wiki-raw.html',
    metaFile: 'ingredient-wiki-metadata.json',
    minBytes: 50_000,
    marker: 'ゆめのかけら'
  }
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// 取得失敗（ネットワーク・タイムアウト・5xx）は少回数リトライする。
// ただし 429（レート制限）はリトライせず即中断する。
// タイムアウトは本文(response.text())の読み出しまでカバーし、ヘッダ受信後に
// ストリームが停止してもハングしないようにする。
async function fetchWithRetry(url, { retries = 2, timeoutMs = 30_000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } catch (err) {
        const reason = err.name === 'AbortError' ? `タイムアウト (${timeoutMs}ms)` : err.message;
        if (attempt >= retries) throw new Error(`取得失敗: ${reason}`);
        console.warn(`  ⚠ ${reason}。リトライします (${attempt + 1}/${retries})...`);
        await sleep(1000 * 2 ** attempt);
        continue;
      }

      if (response.status === 429) {
        throw new Error('HTTP 429 (Too Many Requests): レート制限のため中断します。リトライしません。');
      }
      if (response.status >= 500 && attempt < retries) {
        console.warn(`  ⚠ HTTP ${response.status}: ${response.statusText}。リトライします (${attempt + 1}/${retries})...`);
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      return { html, status: response.status, statusText: response.statusText };
    } finally {
      clearTimeout(timer);
    }
  }
}

async function download(targetName) {
  const target = TARGETS[targetName];
  if (!target) {
    console.error(`Unknown target: ${targetName}`);
    console.error(`Available: ${Object.keys(TARGETS).join(', ')}`);
    process.exit(1);
  }

  console.log(`Downloading ${targetName} wiki: ${target.url}`);

  const { html, status, statusText } = await fetchWithRetry(target.url);

  // 本文の妥当性検証。劣化した HTML を保存して後続パースに渡さない。
  const byteLength = Buffer.byteLength(html, 'utf8');
  if (byteLength < target.minBytes) {
    throw new Error(
      `本文が短すぎます (${byteLength} < ${target.minBytes} bytes)。` +
      `エラーページ・空ページ・途中切断の可能性があるため保存を中止します。`
    );
  }
  if (target.marker && !html.includes(target.marker)) {
    throw new Error(
      `期待するマーカー "${target.marker}" が本文に見つかりません。` +
      `想定外のページの可能性があるため保存を中止します。`
    );
  }

  fs.mkdirSync(dataDir, { recursive: true });

  const htmlPath = path.join(dataDir, target.htmlFile);
  fs.writeFileSync(htmlPath, html, 'utf8');

  const metadata = {
    url: target.url,
    downloadDate: new Date().toISOString(),
    size: html.length,
    status,
    statusText
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
