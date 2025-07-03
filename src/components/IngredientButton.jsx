import { memo } from 'react';

const IngredientButton = memo(({ ingredient, isActive, onClick }) => (
  <button
    className={`ingredient-button ${isActive ? 'active' : ''}`}
    onClick={() => onClick(ingredient)}
  >
    {ingredient}
  </button>
));

IngredientButton.displayName = 'IngredientButton';

export default IngredientButton;