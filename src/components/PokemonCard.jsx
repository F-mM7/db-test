import { useMemo, memo } from 'react';
import { LV60_PATTERNS } from '../utils/constants';

function PokemonCard({ pokemon, selectedIngredient, getMaxValueForIngredient }) {
  // ポケモンのA、B、C食材を特定
  const ingredientTypes = useMemo(() => {
    const patterns = pokemon.ingredientPatterns;
    let ingredientA = null, ingredientB = null, ingredientC = null;
    
    // AAAパターンからA食材を取得
    if (patterns['AAA']) {
      ingredientA = patterns['AAA'].ingredients[0];
    }
    
    // ABBパターンからB食材を取得
    if (patterns['ABB']) {
      ingredientA = ingredientA || patterns['ABB'].ingredients[0];
      ingredientB = patterns['ABB'].ingredients[1];
    }
    
    // AACパターンからC食材を取得
    if (patterns['AAC']) {
      ingredientA = ingredientA || patterns['AAC'].ingredients[0];
      ingredientC = patterns['AAC'].ingredients[2];
    }
    
    return { A: ingredientA, B: ingredientB, C: ingredientC };
  }, [pokemon.ingredientPatterns]);
  
  // 選択した食材がA/B/Cのどれに該当するかを判定
  const ingredientType = useMemo(() => {
    if (ingredientTypes.A === selectedIngredient) return 'A';
    if (ingredientTypes.B === selectedIngredient) return 'B';
    if (ingredientTypes.C === selectedIngredient) return 'C';
    return '';
  }, [ingredientTypes, selectedIngredient]);
  
  // 選択された食材についての最大値を計算
  const maxItem = useMemo(() => {
    return getMaxValueForIngredient(pokemon, selectedIngredient);
  }, [pokemon, selectedIngredient, getMaxValueForIngredient]);

  return (
    <div className="pokemon-card">
      <div className="pokemon-header">
        <h3>
          <span className="pokemon-name">
            {pokemon.name}
            {ingredientType && <span className="ingredient-label">{ingredientType}</span>}
          </span>
          <span className="max-value">
            {maxItem.value > 0 ? maxItem.value.toFixed(1) : 'N/A'}
          </span>
        </h3>
      </div>
      
      <div className="pokemon-ingredients">
        <div className="ingredient-types">
          <div className="ingredient-row">
            <span className="ingredient-label-text">A:</span>
            <span className="ingredient-name">{ingredientTypes.A || 'なし'}</span>
          </div>
          <div className="ingredient-row">
            <span className="ingredient-label-text">B:</span>
            <span className="ingredient-name">{ingredientTypes.B || 'なし'}</span>
          </div>
          <div className="ingredient-row">
            <span className="ingredient-label-text">C:</span>
            <span className="ingredient-name">{ingredientTypes.C || 'なし'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PokemonCard);