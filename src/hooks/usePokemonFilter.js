import { useState, useMemo, useCallback } from 'react';
import { LV60_PATTERNS } from '../utils/constants';

export function usePokemonFilter(pokemonData, ingredientData = []) {
  const [userSelected, setUserSelected] = useState(null);

  // 食材名 → 基礎エナジー の参照テーブル
  const baseEnergyMap = useMemo(() => {
    const map = new Map();
    ingredientData.forEach(({ name, baseEnergy }) => {
      map.set(name, baseEnergy);
    });
    return map;
  }, [ingredientData]);

  // 全食材リストを基礎エナジー昇順で並べ替え（基礎エナジー不明は名前順で末尾）
  const ingredients = useMemo(() => {
    const ingredientSet = new Set();

    pokemonData.forEach(pokemon => {
      Object.values(pokemon.ingredientPatterns).forEach(pattern => {
        pattern.ingredients.forEach(ingredient => {
          ingredientSet.add(ingredient);
        });
      });
    });

    return Array.from(ingredientSet).sort((a, b) => {
      const energyA = baseEnergyMap.get(a);
      const energyB = baseEnergyMap.get(b);
      if (energyA == null && energyB == null) return a.localeCompare(b);
      if (energyA == null) return 1;
      if (energyB == null) return -1;
      if (energyA !== energyB) return energyA - energyB;
      return a.localeCompare(b);
    });
  }, [pokemonData, baseEnergyMap]);

  // 初期選択: 基礎エナジーが最大の食材（ingredientData 未ロード時は null）
  const defaultIngredient = useMemo(() => {
    if (ingredientData.length === 0) return null;
    const max = ingredientData.reduce((acc, item) => (
      !acc || item.baseEnergy > acc.baseEnergy ? item : acc
    ), null);
    return max?.name ?? null;
  }, [ingredientData]);

  // ユーザーが選択していなければ既定値（最大エナジー食材）を使う
  const selectedIngredient = userSelected ?? defaultIngredient;

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

  return {
    selectedIngredient,
    setSelectedIngredient: setUserSelected,
    ingredients,
    filteredPokemon,
    getMaxValueForIngredient
  };
}