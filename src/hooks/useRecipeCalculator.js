import { useState, useMemo, useCallback } from 'react';

// 鍋サイズのプリセット（初期12、3刻みで拡張可能、最大81）
export const POT_SIZE_PRESETS = [15, 24, 36, 48, 57, 81];

export function useRecipeCalculator(recipeData) {
  const [selectedRecipes, setSelectedRecipes] = useState({});
  const [potSize, setPotSize] = useState(null);
  const [sortByEnergy, setSortByEnergy] = useState(false);

  // カテゴリ一覧をデータから導出
  const categories = useMemo(() => {
    const categorySet = new Set();
    recipeData.forEach(recipe => {
      categorySet.add(recipe.category);
    });
    return Array.from(categorySet);
  }, [recipeData]);

  // 鍋サイズ・カテゴリでフィルタし、エナジーでソートした料理リスト
  const getFilteredRecipes = useCallback((category) => {
    let filtered = recipeData.filter(r => r.category === category);

    if (potSize !== null) {
      filtered = filtered.filter(r => r.totalIngredients <= potSize);
    }

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

  // 鍋サイズを設定（null = フィルタなし）
  const handleSetPotSize = useCallback((size) => {
    setPotSize(prev => prev === size ? null : size);
  }, []);

  // エナジーソートを切替
  const toggleSortByEnergy = useCallback(() => {
    setSortByEnergy(prev => !prev);
  }, []);

  return {
    selectedRecipes,
    totalIngredients,
    setRecipeCount,
    clearAll,
    categories,
    potSize,
    setPotSize: handleSetPotSize,
    sortByEnergy,
    toggleSortByEnergy,
    getFilteredRecipes
  };
}
