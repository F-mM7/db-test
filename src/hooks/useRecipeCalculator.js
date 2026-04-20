import { useState, useMemo, useCallback } from 'react';

// 鍋サイズ（初期12、3刻みで拡張、最大81）
export const POT_SIZE_MIN = 12;
export const POT_SIZE_MAX = 81;
export const POT_SIZE_STEP = 3;
export const POT_SIZE_DEFAULT = 75;

// 日曜のウィークエンドボーナスで鍋容量が 2 倍になる
const WEEKEND_MULTIPLIER = 2;

export function useRecipeCalculator(recipeData, ingredientData = []) {
  const [selectedRecipes, setSelectedRecipes] = useState({});
  const [potSize, setPotSize] = useState(POT_SIZE_DEFAULT);

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

  // 集計に含まれていない食材を基礎エナジー昇順でソート
  // 基礎エナジー不明の食材は末尾にまわす
  // baseEnergyMap / allIngredients は本フック外では使わないため内部に畳み込む
  const missingIngredients = useMemo(() => {
    const baseEnergyMap = new Map();
    const allIngredients = new Set();
    ingredientData.forEach(({ name, baseEnergy }) => {
      baseEnergyMap.set(name, baseEnergy);
      allIngredients.add(name);
    });
    recipeData.forEach(recipe => {
      recipe.ingredients.forEach(({ name }) => allIngredients.add(name));
    });

    const usedSet = new Set(totalIngredients.map(t => t.name));
    return Array.from(allIngredients)
      .filter(name => !usedSet.has(name))
      .map(name => ({
        name,
        baseEnergy: baseEnergyMap.has(name) ? baseEnergyMap.get(name) : null
      }))
      .sort((a, b) => {
        const ae = a.baseEnergy ?? Infinity;
        const be = b.baseEnergy ?? Infinity;
        return ae - be;
      });
  }, [ingredientData, recipeData, totalIngredients]);

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
  }, []);

  // 全選択をクリア
  const clearAll = useCallback(() => {
    setSelectedRecipes({});
  }, []);

  // 鍋サイズを増減
  const incrementPotSize = useCallback(() => {
    setPotSize(prev => Math.min(prev + POT_SIZE_STEP, POT_SIZE_MAX));
  }, []);

  const decrementPotSize = useCallback(() => {
    setPotSize(prev => Math.max(prev - POT_SIZE_STEP, POT_SIZE_MIN));
  }, []);

  return {
    selectedRecipes,
    totalIngredients,
    missingIngredients,
    setRecipeCount,
    clearAll,
    categories,
    potSize,
    incrementPotSize,
    decrementPotSize,
    getFilteredRecipes
  };
}
