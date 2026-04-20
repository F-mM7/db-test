import { memo } from 'react';
import { ingredientIconUrl } from '../utils/constants';

const IngredientIcon = memo(({ name, quantity }) => (
  <span className="ingredient-icon-wrapper" title={name}>
    <img
      className="ingredient-icon"
      src={ingredientIconUrl(name)}
      alt={name}
      loading="lazy"
    />
    <span className="ingredient-icon-qty">{quantity}</span>
  </span>
));

IngredientIcon.displayName = 'IngredientIcon';

export default IngredientIcon;
