import { memo } from 'react';
import { usePokemonData } from '../hooks/usePokemonData';
import { usePokemonFilter } from '../hooks/usePokemonFilter';
import PokemonCard from './PokemonCard';
import IngredientButton from './IngredientButton';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import './IngredientFilter.css';

function IngredientFilter() {
  const { pokemonData, loading, error } = usePokemonData();
  const {
    selectedIngredient,
    ingredients,
    filteredPokemon,
    getMaxValueForIngredient,
    handleIngredientClick,
    clearFilter
  } = usePokemonFilter(pokemonData);

  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="page-container ingredient-filter-container">
      <header>
        <h1 className="gradient-title">ポケモンスリープ 食材別ポケモン検索</h1>
      </header>
      
      <IngredientSelection 
        ingredients={ingredients}
        selectedIngredient={selectedIngredient}
        onIngredientClick={handleIngredientClick}
      />

      {selectedIngredient && (
        <SearchResults
          selectedIngredient={selectedIngredient}
          filteredPokemon={filteredPokemon}
          getMaxValueForIngredient={getMaxValueForIngredient}
          onClear={clearFilter}
        />
      )}

      <footer className="info">
        <p className="note">
          ※ 推定値はせいかく・サブスキル無補正、睡眠時間8時間半、所持数溢れ無しを想定
        </p>
      </footer>
    </div>
  );
}

const IngredientSelection = memo(({ ingredients, selectedIngredient, onIngredientClick }) => (
  <section className="ingredient-section">
    <h2>食材を選択</h2>
    <div className="ingredient-buttons">
      {ingredients.map(ingredient => (
        <IngredientButton
          key={ingredient}
          ingredient={ingredient}
          isActive={selectedIngredient === ingredient}
          onClick={onIngredientClick}
        />
      ))}
    </div>
  </section>
));

const SearchResults = memo(({ 
  selectedIngredient, 
  filteredPokemon, 
  getMaxValueForIngredient, 
  onClear 
}) => (
  <section className="results-section">
    <div className="selected-header">
      <h2>「{selectedIngredient}」を獲得できるポケモン</h2>
      <button className="clear-button" onClick={onClear}>
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
  </section>
));

IngredientSelection.displayName = 'IngredientSelection';
SearchResults.displayName = 'SearchResults';

export default IngredientFilter;