#!/usr/bin/env node

import * as cheerio from 'cheerio';
import process from 'process';
import { loadHtml, loadJson, writeJson, dataDir, publicDir } from './lib/io.js';
import { assertCount, DATASETS } from './lib/validate.js';

const CATEGORY_TABLE_MAP = [
  { tableIndex: 2, category: 'カレー・シチュー' },
  { tableIndex: 3, category: 'サラダ' },
  { tableIndex: 4, category: 'デザート・ドリンク' }
];

/**
 * Wiki 側で値が欠けている場合に補完する手動オーバーライド。
 *
 * 【追加するとき】
 *   Wiki のセルが空欄等で `parseInt(...) || 0` になってしまう料理について、
 *   `'<料理名>': { <フィールド>: <正しい値> }` の形で追記する。
 *
 * 【削除するとき】
 *   Wiki が更新されてセルに値が入ると、parse 実行時に
 *     ⚠ Override for "..." is now redundant (...). Please remove ...
 *   または
 *     ⚠ Override for "..." differs from wiki value (...). Please verify ...
 *   という警告が出る。警告が出た料理はこのテーブルから削除すること。
 *   （Wiki の値が正しければ Wiki が常に優先される）
 *
 * 参照元: https://wikiwiki.jp/poke_sleep/料理/レシピの一覧
 */
const RECIPE_OVERRIDES = {};

/**
 * Wiki から取得した recipe にオーバーライドを適用する。
 * - Wiki 側の値が「欠損」(falsy) のときだけ補完値を使う。
 * - Wiki 側に値がある場合は Wiki を優先し、警告を出して削除を促す。
 */
function applyRecipeOverride(recipe) {
  const override = RECIPE_OVERRIDES[recipe.name];
  if (!override) return recipe;

  const merged = { ...recipe };
  for (const [key, fallbackValue] of Object.entries(override)) {
    const wikiValue = recipe[key];
    if (wikiValue) {
      if (wikiValue === fallbackValue) {
        console.warn(
          `  ⚠ Override for "${recipe.name}".${key} is now redundant ` +
          `(wiki=${wikiValue} matches override). ` +
          `Please remove this entry from RECIPE_OVERRIDES.`
        );
      } else {
        console.warn(
          `  ⚠ Override for "${recipe.name}".${key} differs from wiki value ` +
          `(wiki=${wikiValue}, override=${fallbackValue}). ` +
          `Please verify and remove this entry from RECIPE_OVERRIDES.`
        );
      }
    } else {
      merged[key] = fallbackValue;
      console.log(`  ↳ Override applied to "${recipe.name}".${key}: ${fallbackValue}`);
    }
  }
  return merged;
}

function parseIngredients($, cell) {
  const links = $(cell).find('a.rel-wiki-page');
  if (links.length === 0) return [];

  const fullText = $(cell).text().trim();
  const ingredients = [];

  links.each((_, link) => {
    const name = $(link).text().trim();
    if (!name) return;

    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = fullText.match(new RegExp(escapedName + '×(\\d+)'));
    if (match) {
      ingredients.push({ name, quantity: parseInt(match[1], 10) });
    }
  });

  return ingredients;
}

function parseTable($, table, category) {
  const recipes = [];
  // 構造異常によるスキップ件数（「ごちゃまぜ」行の意図的スキップは含めない）
  let anomalous = 0;
  $(table).find('tr').slice(1).each((_, row) => {
    const cells = $(row).find('td');

    // 列数が4未満の行は区切り・見出しなどの非データ行とみなして静かにスキップする
    if (cells.length < 4) return;

    // 「ごちゃまぜ」行は番号セルが "-" なので意図的にスキップ（異常ではない）
    if ($(cells[0]).text().trim() === '-') return;

    const name = $(cells[2]).text().trim();
    if (!name) {
      console.warn(`  Warning: ${category} に料理名が空の行があります`);
      anomalous++;
      return;
    }

    const ingredients = parseIngredients($, cells[3]);
    if (ingredients.length === 0) {
      console.warn(`  Warning: No ingredients found for "${name}"`);
      anomalous++;
      return;
    }

    // 空欄セルの 0 化は RECIPE_OVERRIDES による補完を前提とした意図的フォールバック
    const totalIngredients = parseInt($(cells[4]).text().trim(), 10) || 0;
    const energy = parseInt($(cells[5]).text().trim(), 10) || 0;

    const recipe = { name, category, ingredients, totalIngredients, energy };
    recipes.push(applyRecipeOverride(recipe));
  });
  return { recipes, anomalous };
}

export function parseRecipeData() {
  console.log('Pokemon Sleep Recipe Wiki Data Parser');
  console.log('=====================================');

  try {
    const html = loadHtml('recipe-wiki-raw.html', 'Please run "npm run download-recipe-wiki" first.');
    const $ = cheerio.load(html);
    const tables = $('table');
    console.log(`Found ${tables.length} tables`);

    const previous = loadJson(DATASETS.recipe.file);
    const allRecipes = [];
    let totalAnomalous = 0;
    for (const { tableIndex, category } of CATEGORY_TABLE_MAP) {
      const table = tables.eq(tableIndex);
      // テーブル未検出はカテゴリ丸ごとの欠落＝劣化データになるため中止する
      if (table.length === 0) {
        throw new Error(`${category} のテーブル（index ${tableIndex}）が見つかりません。Wiki のテーブル構成変更が疑われます。`);
      }
      console.log(`\nParsing ${category}...`);
      const { recipes, anomalous } = parseTable($, table, category);
      console.log(`  ✓ Found ${recipes.length} recipes`);
      allRecipes.push(...recipes);
      totalAnomalous += anomalous;
    }

    if (totalAnomalous > 0) {
      throw new Error(`${totalAnomalous} 件の料理行が想定外の構造でスキップされました。Wiki のテーブル構造変更が疑われます。`);
    }
    assertCount(DATASETS.recipe.label, allRecipes.length, {
      absoluteMin: DATASETS.recipe.absoluteMin,
      previousCount: previous?.length ?? null
    });

    writeJson(publicDir, 'recipe-data.json', allRecipes);

    const byCategory = {};
    for (const { category } of CATEGORY_TABLE_MAP) {
      byCategory[category] = allRecipes.filter(r => r.category === category).length;
    }
    writeJson(dataDir, 'recipe-parse-summary.json', {
      parseDate: new Date().toISOString(),
      totalRecipes: allRecipes.length,
      byCategory,
      uniqueIngredients: [...new Set(allRecipes.flatMap(r => r.ingredients.map(i => i.name)))].sort(),
      sampleData: allRecipes.slice(0, 3)
    });

    console.log(`\n✓ Total recipes: ${allRecipes.length}`);
    for (const [cat, count] of Object.entries(byCategory)) {
      console.log(`    ${cat}: ${count}`);
    }
    return allRecipes;
  } catch (error) {
    console.error('Error parsing recipe wiki data:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  parseRecipeData();
}
