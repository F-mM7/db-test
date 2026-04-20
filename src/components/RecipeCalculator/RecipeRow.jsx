import { memo } from 'react';
import IngredientIcon from '../IngredientIcon';

const RecipeRow = memo(({ variant, recipe, count, onCountChange }) => {
  const isSummary = variant === 'summary';
  const rowClassName = !isSummary && count > 0 ? 'recipe-row selected' : 'recipe-row';
  const decrementDisabled = isSummary ? count <= 1 : count <= 0;

  return (
    <div className={rowClassName}>
      <span className="recipe-name">{recipe.name}</span>
      <span className="recipe-weekend-cell">
        {isSummary ? (
          <span className="summary-category-badge badge badge--outline badge--sm">{recipe.category}</span>
        ) : (
          recipe.weekendOnly && (
            <span className="badge badge--solid-orange badge--sm">週末</span>
          )
        )}
      </span>
      <span className="recipe-total-badge badge badge--outline badge--sm badge--block">計{recipe.totalIngredients}</span>
      <span className="recipe-energy-badge badge badge--outline badge--sm badge--block">{recipe.energy.toLocaleString()} En</span>
      <div className="recipe-ingredients-summary">
        {recipe.ingredients.map(ing => (
          <IngredientIcon
            key={ing.name}
            name={ing.name}
            quantity={isSummary ? ing.quantity * count : ing.quantity}
          />
        ))}
      </div>
      <div className="recipe-count-control">
        <button
          className="icon-btn icon-btn-count"
          onClick={() => onCountChange(recipe.name, count - 1)}
          disabled={decrementDisabled}
        >
          -
        </button>
        <span className="count-display">{count}</span>
        <button
          className="icon-btn icon-btn-count"
          onClick={() => onCountChange(recipe.name, count + 1)}
        >
          +
        </button>
        {isSummary && (
          <button
            className="icon-btn icon-btn-remove"
            onClick={() => onCountChange(recipe.name, 0)}
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
});

RecipeRow.displayName = 'RecipeRow';

export default RecipeRow;
