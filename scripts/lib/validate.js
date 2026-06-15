#!/usr/bin/env node

import process from 'process';
import { loadJson } from './io.js';

/**
 * パース結果・公開データの妥当性検証を集約するモジュール。
 *
 * - 各パーススクリプトは parse 直後に assertCount でデータ件数を検証する。
 * - デプロイ前ゲート（predeploy）はこのファイルを直接実行し、
 *   公開対象の public/*.json 3 ファイルをまとめて最終検証する。
 *
 * 件数の絶対下限はデータセットごとの既知件数（2026 時点でポケモン 231 /
 * 料理 76 / 食材 19）に対して余裕を持たせた値。Wiki 構造変更や取得失敗で
 * データが消失・激減した場合に、劣化データを書き込み・公開する前に止める。
 */
export const DATASETS = {
  pokemon: { file: 'pokemon-data.json', label: 'ポケモン', absoluteMin: 200 },
  recipe: { file: 'recipe-data.json', label: '料理', absoluteMin: 60 },
  ingredient: { file: 'ingredient-data.json', label: '食材', absoluteMin: 15 }
};

/**
 * データ件数を検証し、異常なら例外を投げる（呼び出し側で exit 1 にする）。
 * @param {string} label データセット名（エラーメッセージ用）
 * @param {number} count 今回の抽出件数
 * @param {object} opts
 * @param {number} opts.absoluteMin 絶対下限件数
 * @param {number|null} [opts.previousCount] 前回件数（あれば急減チェックに使う）
 * @param {number} [opts.maxDropRatio] 前回比の許容減少率（既定 0.2 = 20%）
 */
export function assertCount(label, count, { absoluteMin, previousCount = null, maxDropRatio = 0.2 } = {}) {
  if (typeof count !== 'number' || count < absoluteMin) {
    throw new Error(
      `${label}: 抽出件数 ${count} 件が下限 ${absoluteMin} 件を下回りました。` +
      `データ取得・パースの異常が疑われるため処理を中止します。`
    );
  }
  if (previousCount != null && previousCount > 0) {
    const minAllowed = Math.floor(previousCount * (1 - maxDropRatio));
    if (count < minAllowed) {
      const dropPct = Math.round((1 - count / previousCount) * 100);
      throw new Error(
        `${label}: 抽出件数 ${count} 件が前回 ${previousCount} 件から ${dropPct}% 減少しました` +
        `（許容下限 ${minAllowed} 件）。データ欠損が疑われるため処理を中止します。`
      );
    }
  }
}

/**
 * 公開対象の JSON 3 ファイルをまとめて検証する。デプロイ前ゲート用。
 * @returns {string[]} 各データセットの検証結果メッセージ
 */
export function validateAllPublicData() {
  const results = [];
  for (const { file, label, absoluteMin } of Object.values(DATASETS)) {
    const data = loadJson(file);
    if (data == null) {
      throw new Error(`${label}: ${file} が見つかりません。先にデータ取得（fetch-data 等）を実行してください。`);
    }
    if (!Array.isArray(data)) {
      throw new Error(`${label}: ${file} が配列ではありません。データが破損している可能性があります。`);
    }
    assertCount(label, data.length, { absoluteMin });
    results.push(`${label}: ${data.length} 件`);
  }
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('公開データの検証を開始します...');
  try {
    validateAllPublicData().forEach(r => console.log(`  ✓ ${r}`));
    console.log('✓ 公開データの検証に成功しました');
  } catch (error) {
    console.error('✗ 公開データの検証に失敗しました:', error.message);
    process.exit(1);
  }
}
