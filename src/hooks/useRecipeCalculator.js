import { useState, useMemo, useCallback } from 'react';

// 鍋サイズ（初期12、3刻みで拡張、最大81）
export const POT_SIZE_MIN = 12;
export const POT_SIZE_MAX = 81;
export const POT_SIZE_STEP = 3;
export const POT_SIZE_DEFAULT = 75;

export function useRecipeCalculator(recipeData) {
  const [selectedRecipes, setSelectedRecipes] = useState({});
  const [potSize, setPotSize] = useState(POT_SIZE_DEFAULT);
  const sortByEnergy = true;

  // カテゴリ一覧をデータから導出
  const categories = useMemo(() => {
    const categorySet = new Set();
    recipeData.forEach(recipe => {
      categorySet.add(recipe.category);
    });
    return Array.from(categorySet);
  }, [recipeData]);

  // 鍋サイズ・カテゴリでフィルタし、エナジーでソートした料理リスト
  // 週末は鍋サイズが1.5倍になるため、weekendOnly フラグで区別
  const getFilteredRecipes = useCallback((category) => {
    const weekendPotSize = Math.floor(potSize * 2);
    let filtered = recipeData
      .filter(r => r.category === category && r.totalIngredients <= weekendPotSize)
      .map(r => ({
        ...r,
        weekendOnly: r.totalIngredients > potSize
      }));

    if (sortByEnergy) {
      filtered = [...filtered].sort((a, b) => b.energy - a.energy);
    }

    return filtered;
  }, [recipeData, potSize, sortByEnergy]);

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
    setRecipeCount,
    clearAll,
    categories,
    potSize,
    incrementPotSize,
    decrementPotSize,
    getFilteredRecipes
  };
}
