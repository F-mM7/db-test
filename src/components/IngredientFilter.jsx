import { useFetchJson } from '../hooks/useFetchJson';
import { usePokemonFilter } from '../hooks/usePokemonFilter';
import { DATA_URL } from '../utils/constants';
import PokemonCard from './PokemonCard';
import IngredientButton from './IngredientButton';
import AsyncBoundary from './AsyncBoundary';
import './IngredientFilter.css';

function IngredientFilter() {
  const { data: pokemonData, loading, error } = useFetchJson(DATA_URL);
  const {
    selectedIngredient,
    setSelectedIngredient,
    ingredients,
    filteredPokemon,
    getMaxValueForIngredient
  } = usePokemonFilter(pokemonData);

  return (
    <AsyncBoundary loading={loading} error={error}>
      <div className="page-container ingredient-filter-container">
        <section className="ingredient-section">
          <h2>食材を選択</h2>
          <div className="ingredient-buttons">
            {ingredients.map(ingredient => (
              <IngredientButton
                key={ingredient}
                ingredient={ingredient}
                isActive={selectedIngredient === ingredient}
                onClick={setSelectedIngredient}
              />
            ))}
          </div>
        </section>

        {selectedIngredient && (
          <section className="results-section">
            <div className="selected-header">
              <h2>「{selectedIngredient}」を獲得できるポケモン</h2>
              <button className="btn btn-sm btn-danger" onClick={() => setSelectedIngredient(null)}>
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
          </section>
        )}

        <footer className="info">
          <p className="note">
            ※ 推定値はせいかく・サブスキル無補正、睡眠時間8時間半、所持数溢れ無しを想定
          </p>
        </footer>
      </div>
    </AsyncBoundary>
  );
}

export default IngredientFilter;
