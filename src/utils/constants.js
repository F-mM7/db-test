// データパターン定義
export const LV60_PATTERNS = ['AAA', 'AAC', 'ABB'];

// API エンドポイント
export const DATA_URL = '/pokesleep-kitchen/pokemon-data.json';
export const RECIPE_DATA_URL = '/pokesleep-kitchen/recipe-data.json';

// 食材アイコン
const BASE_URL = import.meta.env.BASE_URL;
const WEBP_INGREDIENTS = new Set(['ずっしりカボチャ', 'つやつやアボカド', 'めざましコーヒー']);
export function ingredientIconUrl(name) {
  const ext = WEBP_INGREDIENTS.has(name) ? 'webp' : 'png';
  return `${BASE_URL}icons/${encodeURIComponent(name)}.${ext}`;
}

// フィルタリング設定
export const FILTER_CONFIG = {
  patterns: LV60_PATTERNS,
  sampleSize: 3 // サマリー用のサンプル件数
};