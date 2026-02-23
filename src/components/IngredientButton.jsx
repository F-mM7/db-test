import { memo } from 'react';
import { ingredientIconUrl } from '../utils/constants';

const IngredientButton = memo(({ ingredient, isActive, onClick }) => (
  <button
    className={`ingredient-button ${isActive ? 'active' : ''}`}
    onClick={() => onClick(ingredient)}
  >
    <img
      className="ingredient-button-icon"
      src={ingredientIconUrl(ingredient)}
      alt=""
      loading="lazy"
    />
    {ingredient}
  </button>
));

IngredientButton.displayName = 'IngredientButton';

export default IngredientButton;
