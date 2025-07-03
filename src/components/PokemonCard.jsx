import { useMemo, memo } from 'react';

const LV60_PATTERNS = ['AAA', 'AAB', 'AAC', 'ABA', 'ABB', 'ABC'];

function PokemonCard({ pokemon, selectedIngredient, getMaxValueForIngredient }) {
  // ポケモンのA、B、C食材を特定
  const ingredientTypes = useMemo(() => {
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