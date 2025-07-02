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
      return Object.values(pokemon.ingredientPatterns).some(pattern => 
        pattern.ingredients.includes(ingredient)
      );
    });
    
    setFilteredPokemon(filtered);
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
            {filteredPokemon.map(pokemon => (
              <div key={pokemon.id} className="pokemon-card">
                <h3>{pokemon.name}</h3>
                <div className="patterns">
                  {Object.entries(pokemon.ingredientPatterns)
                    .filter(([_, pattern]) => pattern.ingredients.includes(selectedIngredient))
                    .map(([patternName, pattern]) => (
                      <div key={patternName} className="pattern-info">
                        <span className="pattern-name">{patternName}:</span>
                        <span className="ingredients">{pattern.ingredients.join(', ')}</span>
                        <div className="values">
                          <span>Lv.1: {pattern.values[1]}</span>
                          <span>Lv.30: {pattern.values[30]}</span>
                          <span>Lv.60: {pattern.values[60]}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
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