import { memo } from 'react';
import { ingredientIconUrl } from '../../utils/constants';

const MissingIngredients = memo(({ ingredients }) => (
  <section className="missing-ingredients-section">
    <div className="results-header">
      <h2>集計にない食材</h2>
      <span className="missing-ingredients-count badge badge--outline">{ingredients.length} 種類</span>
    </div>

    <div className="missing-ingredients-grid">
      {ingredients.map(({ name, baseEnergy }) => (
        <div key={name} className="ingredient-card ingredient-card--muted">
          <img
            className="ingredient-card__icon"
            src={ingredientIconUrl(name)}
            alt={name}
          />
          <span className="ingredient-card__name">{name}</span>
          <span className="missing-ingredient-energy badge badge--outline badge--sm">
            {baseEnergy != null ? baseEnergy : '—'}
          </span>
        </div>
      ))}
    </div>
  </section>
));

MissingIngredients.displayName = 'MissingIngredients';

export default MissingIngredients;
