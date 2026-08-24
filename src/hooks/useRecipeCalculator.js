import { useMemo, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

// 鍋サイズ（初期12、3刻みで拡張、最大81）
export const POT_SIZE_MIN = 12;
export const POT_SIZE_MAX = 81;
const POT_SIZE_STEP = 3;
const POT_SIZE_DEFAULT = 78;

// 日曜のウィークエンドボーナスで鍋容量が 2 倍になる
const WEEKEND_MULTIPLIER = 2;

const SELECTED_RECIPES_KEY = 'pokesleep-kitchen:recipeCalculator:selectedRecipes';
const POT_SIZE_KEY = 'pokesleep-kitchen:recipeCalculator:potSize';

export function useRecipeCalculator(recipeData, ingredientData = []) {
  const [selectedRecipes, setSelectedRecipes] = useLocalStorage(SELECTED_RECIPES_KEY, {});
  const [potSize, setPotSize] = useLocalStorage(POT_SIZE_KEY, POT_SIZE_DEFAULT);

  const categories = useMemo(() => {
    const set = new Set();
    recipeData.forEach(r => set.add(r.category));
    return Array.from(set);
  }, [recipeData]);

  // 鍋サイズ・カテゴリでフィルタし、エナジー降順でソート。
  // 週末（鍋容量 2 倍）でしか作れないものは weekendOnly フラグで区別する。
  const getFilteredRecipes = useCallback((category) => {
    const weekendPotSize = potSize * WEEKEND_MULTIPLIER;
    return recipeData
      .filter(r => r.category === category && r.totalIngredients <= weekendPotSize)
      .map(r => ({ ...r, weekendOnly: r.totalIngredients > potSize }))
      .sort((a, b) => b.energy - a.energy);
  }, [recipeData, potSize]);

  // 必要食材の合計を算出
  const totalIngredients = useMemo(() => {
    const totals = {};

    Object.entries(selectedRecipes).forEach(([recipeName, count]) => {
      if (count <= 0) return;
      const recipe = recipeData.find(r => r.name === recipeName);
      if (!recipe) return;

      recipe.ingredients.forEach(({ name, quantity }) => {
        totals[name] = (totals[name] || 0) + quantity * count;
      });
    });

    // 数量の降順でソート
    return Object.entries(totals)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [selectedRecipes, recipeData]);

  // 全食材を基礎エナジー昇順でソートし、必要食材の数量を付与する。
  // 必要食材は通常表示、それ以外は muted 表示で「追加エナジー」セクションに使う。
  // 基礎エナジー不明の食材は末尾にまわす。
  // ingredient-data.json に全食材が列挙されている前提で recipeData は走査しない
  const allIngredients = useMemo(() => {
    const quantityByName = new Map(totalIngredients.map(t => [t.name, t.quantity]));
    return ingredientData
      .map(({ name, baseEnergy }) => ({
        name,
        baseEnergy: baseEnergy ?? null,
        quantity: quantityByName.get(name) ?? 0
      }))
      .sort((a, b) => {
        const ae = a.baseEnergy ?? Infinity;
        const be = b.baseEnergy ?? Infinity;
        return ae - be;
      });
  }, [ingredientData, totalIngredients]);

  // 料理の回数を設定
  const setRecipeCount = useCallback((recipeName, count) => {
    setSelectedRecipes(prev => {
      const next = { ...prev };
      if (count <= 0) {
        delete next[recipeName];
      } else {
        next[recipeName] = count;
      }
      return next;
    });
  }, [setSelectedRecipes]);

  // 全選択をクリア
  const clearAll = useCallback(() => {
    setSelectedRecipes({});
  }, [setSelectedRecipes]);

  // 鍋サイズを増減
  const incrementPotSize = useCallback(() => {
    setPotSize(prev => Math.min(prev + POT_SIZE_STEP, POT_SIZE_MAX));
  }, [setPotSize]);

  const decrementPotSize = useCallback(() => {
    setPotSize(prev => Math.max(prev - POT_SIZE_STEP, POT_SIZE_MIN));
  }, [setPotSize]);

  return {
    selectedRecipes,
    totalIngredients,
    allIngredients,
    setRecipeCount,
    clearAll,
    categories,
    potSize,
    incrementPotSize,
    decrementPotSize,
    getFilteredRecipes
  };
}
