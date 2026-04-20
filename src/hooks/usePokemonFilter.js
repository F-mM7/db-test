import { useState, useMemo, useCallback } from 'react';
import { LV60_PATTERNS } from '../utils/constants';

export function usePokemonFilter(pokemonData) {
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // 全食材リストをメモ化
  const ingredients = useMemo(() => {
    const ingredientSet = new Set();
    
    pokemonData.forEach(pokemon => {
      Object.values(pokemon.ingredientPatterns).forEach(pattern => {
        pattern.ingredients.forEach(ingredient => {
          ingredientSet.add(ingredient);
        });
      });
    });
    
    return Array.from(ingredientSet).sort();
  }, [pokemonData]);

  // 最大値取得のユーティリティ関数
  const getMaxValueForIngredient = useCallback((pokemon, ingredient) => {
    const values = LV60_PATTERNS
      .map(name => pokemon.ingredientPatterns[name]?.individualValues?.[ingredient] || 0)
      .filter(v => v > 0);
    return values.length > 0 ? Math.max(...values) : 0;
  }, []);

  // フィルタリングされたポケモンリストをメモ化
  const filteredPokemon = useMemo(() => {
    if (!selectedIngredient) return [];

    const filtered = pokemonData.filter(pokemon => {
      return LV60_PATTERNS.some(patternName => {
        const pattern = pokemon.ingredientPatterns[patternName];
        return pattern && pattern.ingredients.includes(selectedIngredient);
      });
    });

    return filtered.sort((a, b) => {
      const maxA = getMaxValueForIngredient(a, selectedIngredient);
      const maxB = getMaxValueForIngredient(b, selectedIngredient);
      return maxB - maxA;
    });
  }, [pokemonData, selectedIngredient, getMaxValueForIngredient]);

  const handleIngredientClick = useCallback((ingredient) => {
    setSelectedIngredient(ingredient);
  }, []);

  const clearFilter = useCallback(() => {
    setSelectedIngredient(null);
  }, []);

  return {
    selectedIngredient,
    ingredients,
    filteredPokemon,
    getMaxValueForIngredient,
    handleIngredientClick,
    clearFilter
  };
}