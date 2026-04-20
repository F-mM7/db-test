import { memo } from 'react';
import { ingredientIconUrl } from '../utils/constants';

function PokemonCard({ pokemon, selectedIngredient, getMaxValueForIngredient }) {
  const { ingredientA, ingredientB, ingredientC } = pokemon;

  const ingredientType =
    selectedIngredient === ingredientA ? 'A' :
    selectedIngredient === ingredientB ? 'B' :
    selectedIngredient === ingredientC ? 'C' : '';

  const maxItem = getMaxValueForIngredient(pokemon, selectedIngredient);

  const slots = [
    { label: 'A', name: ingredientA },
    { label: 'B', name: ingredientB },
    { label: 'C', name: ingredientC }
  ];

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
          {slots.map(({ label, name }) => (
            <div key={label} className="ingredient-row">
              <span className="ingredient-label-text">{label}:</span>
              {name ? (
                <>
                  <img
                    className="ingredient-row-icon"
                    src={ingredientIconUrl(name)}
                    alt=""
                  />
                  <span className="ingredient-name">{name}</span>
                </>
              ) : (
                <span className="ingredient-name">なし</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(PokemonCard);
