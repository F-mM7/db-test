import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import PokemonCard from './PokemonCard';
import IngredientButton from './IngredientButton';
import './IngredientFilter.css';

// 定数定義
const LV60_PATTERNS = ['AAA', 'AAB', 'AAC', 'ABA', 'ABB', 'ABC'];
const DATA_URL = '/db-test/pokemon-data.json';

function IngredientFilter() {
  const [pokemonData, setPokemonData] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(DATA_URL);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setPokemonData(data);
      } catch (err) {
        console.error('Failed to load Pokemon data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

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
    const patternValues = LV60_PATTERNS
      .map(patternName => {
        const pattern = pokemon.ingredientPatterns[patternName];
        const value = pattern?.individualValues?.[ingredient] || 0;
        return { patternName, value };
      })
      .filter(item => item.value > 0);
    
    return patternValues.reduce((max, current) => 
      current.value > max.value ? current : max, 
      { patternName: '', value: 0 }
    );
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
      return maxB.value - maxA.value;
    });
  }, [pokemonData, selectedIngredient, getMaxValueForIngredient]);
  
  const handleIngredientClick = useCallback((ingredient) => {
    setSelectedIngredient(ingredient);
  }, []);

  const clearFilter = useCallback(() => {
    setSelectedIngredient(null);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">データを読み込み中...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <div className="error-text">
          データの読み込みに失敗しました
          <div className="error-detail">{error}</div>
        </div>
        <button className="retry-button" onClick={() => window.location.reload()}>
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="ingredient-filter-container">
      <h1>ポケモンスリープ 食材別ポケモン検索</h1>
      
      <div className="ingredient-section">
        <h2>食材を選択</h2>
        <div className="ingredient-buttons">
          {ingredients.map(ingredient => (
            <IngredientButton
              key={ingredient}
              ingredient={ingredient}
              isActive={selectedIngredient === ingredient}
              onClick={handleIngredientClick}
            />
          ))}
        </div>
      </div>

      {selectedIngredient && (
        <div className="results-section">
          <div className="selected-header">
            <h2>「{selectedIngredient}」を獲得できるポケモン</h2>
            <button className="clear-button" onClick={clearFilter}>
              選択をクリア
            </button>
          </div>
          
          <div className="pokemon-grid">
            {filteredPokemon.map(pokemon => (
              <PokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                selectedIngredient={selectedIngredient}
                getMaxValueForIngredient={getMaxValueForIngredient}
              />
            ))}
          </div>
          
          <div className="result-count">
            {filteredPokemon.length}体のポケモンが見つかりました
          </div>
        </div>
      )}

      <div className="info">
        <p className="note">
          ※ 推定値はせいかく・サブスキル無補正、睡眠時間8時間半、所持数溢れ無しを想定
        </p>
      </div>
    </div>
  );
}

export default IngredientFilter;