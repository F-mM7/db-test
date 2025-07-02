import { useState, useEffect } from 'react';
import './IngredientFilter.css';

function IngredientFilter() {
  const [pokemonData, setPokemonData] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/db-test/pokemon-data.json')
      .then(res => res.json())
      .then(data => {
        setPokemonData(data);
        extractIngredients(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Pokemon data:', err);
        setLoading(false);
      });
  }, []);

  const extractIngredients = (data) => {
    const ingredientSet = new Set();
    
    data.forEach(pokemon => {
      Object.values(pokemon.ingredientPatterns).forEach(pattern => {
        pattern.ingredients.forEach(ingredient => {
          ingredientSet.add(ingredient);
        });
      });
    });
    
    const sortedIngredients = Array.from(ingredientSet).sort();
    setIngredients(sortedIngredients);
  };

  const handleIngredientClick = (ingredient) => {
    setSelectedIngredient(ingredient);
    
    const filtered = pokemonData.filter(pokemon => {
      // Lv.60パターンのみをチェック
      const lv60Patterns = ['AAA', 'AAB', 'AAC', 'ABA', 'ABB', 'ABC'];
      return lv60Patterns.some(patternName => {
        const pattern = pokemon.ingredientPatterns[patternName];
        return pattern && pattern.ingredients.includes(ingredient);
      });
    });
    
    // 選択した食材の最大値でソート（降順）
    const sortedFiltered = filtered.sort((a, b) => {
      const getMaxValue = (pokemon) => {
        const lv60Patterns = ['AAA', 'AAB', 'AAC', 'ABA', 'ABB', 'ABC'];
        const patternValues = lv60Patterns
          .map(patternName => {
            const pattern = pokemon.ingredientPatterns[patternName];
            const value = pattern?.individualValues?.[ingredient] || 0;
            return value;
          })
          .filter(value => value > 0);
        
        return Math.max(...patternValues, 0);
      };
      
      return getMaxValue(b) - getMaxValue(a); // 降順ソート
    });
    
    setFilteredPokemon(sortedFiltered);
  };

  const clearFilter = () => {
    setSelectedIngredient(null);
    setFilteredPokemon([]);
  };

  if (loading) {
    return <div className="loading">データを読み込み中...</div>;
  }

  return (
    <div className="ingredient-filter-container">
      <h1>ポケモンスリープ 食材別ポケモン検索</h1>
      
      <div className="ingredient-section">
        <h2>食材を選択</h2>
        <div className="ingredient-buttons">
          {ingredients.map(ingredient => (
            <button
              key={ingredient}
              className={`ingredient-button ${selectedIngredient === ingredient ? 'active' : ''}`}
              onClick={() => handleIngredientClick(ingredient)}
            >
              {ingredient}
            </button>
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
            {filteredPokemon.map(pokemon => {
              // 選択された食材についての最大値とそのパターンを計算
              const lv60Patterns = ['AAA', 'AAB', 'AAC', 'ABA', 'ABB', 'ABC'];
              const patternValues = lv60Patterns
                .map(patternName => {
                  const pattern = pokemon.ingredientPatterns[patternName];
                  const value = pattern?.individualValues?.[selectedIngredient] || 0;
                  return { patternName, value };
                })
                .filter(item => item.value > 0);
              
              const maxItem = patternValues.reduce((max, current) => 
                current.value > max.value ? current : max, 
                { patternName: '', value: 0 }
              );

              // ポケモンのA、B、C食材を特定
              const getIngredientTypes = () => {
                const patterns = pokemon.ingredientPatterns;
                let ingredientA = null, ingredientB = null, ingredientC = null;
                
                // AAAパターンからA食材を取得
                if (patterns['AAA']) {
                  ingredientA = patterns['AAA'].ingredients[0];
                }
                
                // ABパターンまたはAABパターンからB食材を取得
                if (patterns['AB']) {
                  ingredientA = ingredientA || patterns['AB'].ingredients[0];
                  ingredientB = patterns['AB'].ingredients[1];
                } else if (patterns['AAB']) {
                  ingredientA = ingredientA || patterns['AAB'].ingredients[0];
                  ingredientB = patterns['AAB'].ingredients[2];
                }
                
                // ABCパターンがある場合のみC食材を設定
                if (patterns['ABC']) {
                  ingredientA = ingredientA || patterns['ABC'].ingredients[0];
                  ingredientB = ingredientB || patterns['ABC'].ingredients[1];
                  ingredientC = patterns['ABC'].ingredients[2];
                }
                
                return { A: ingredientA, B: ingredientB, C: ingredientC };
              };
              
              const ingredientTypes = getIngredientTypes();
              
              // 選択した食材がA/B/Cのどれに該当するかを判定
              const getIngredientType = () => {
                if (ingredientTypes.A === selectedIngredient) return 'A';
                if (ingredientTypes.B === selectedIngredient) return 'B';
                if (ingredientTypes.C === selectedIngredient) return 'C';
                return '';
              };
              
              const ingredientType = getIngredientType();

              return (
                <div key={pokemon.id} className="pokemon-card">
                  <h3>
                    <span>{pokemon.name}({ingredientType})</span>
                    <span>{maxItem.value > 0 ? maxItem.value.toFixed(1) : 'N/A'}</span>
                  </h3>
                  <div className="pokemon-ingredients">
                    <div className="ingredient-types">
                      <div className="ingredient-simple">A:{ingredientTypes.A || 'なし'}</div>
                      <div className="ingredient-simple">B:{ingredientTypes.B || 'なし'}</div>
                      <div className="ingredient-simple">C:{ingredientTypes.C || 'なし'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
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