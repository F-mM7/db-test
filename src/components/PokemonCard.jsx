import { memo } from 'react';
import { ingredientIconUrl } from '../utils/constants';

function PokemonCard({ pokemon, selectedIngredient, getMaxValueForIngredient }) {
  const { ingredientPatterns } = pokemon;
  const ingredientA = ingredientPatterns.AAA?.ingredients[0];
  const ingredientB = ingredientPatterns.ABB?.ingredients[1];
  const ingredientC = ingredientPatterns.AAC?.ingredients[2];

  const ingredientType =
    selectedIngredient === ingredientA ? 'A' :
    selectedIngredient === ingredientB ? 'B' :
    selectedIngredient === ingredientC ? 'C' : '';

  const maxValue = getMaxValueForIngredient(pokemon, selectedIngredient);

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
            {ingredientType && (
              <span className="ingredient-label badge badge--solid-blue">{ingredientType}</span>
            )}
          </span>
          <span className="max-value badge badge--solid-red badge--lg">
            {maxValue > 0 ? maxValue.toFixed(1) : 'N/A'}
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
