import { memo } from 'react';
import { ingredientIconUrl } from '../../utils/constants';

const AdditionalEnergy = memo(({ ingredients }) => (
  <section className="additional-energy-section">
    <div className="results-header">
      <h2>追加エナジー</h2>
      <span className="badge badge--outline">{ingredients.length} 種類</span>
    </div>

    <div className="additional-energy-grid">
      {ingredients.map(({ name, quantity, baseEnergy }) => {
        const isInTotal = quantity > 0;
        const className = `ingredient-card${isInTotal ? ' ingredient-card--muted' : ''}`;
        return (
          <div key={name} className={className}>
            <img
              className="icon-img ingredient-card__icon"
              src={ingredientIconUrl(name)}
              alt={name}
            />
            <span className="ingredient-card__name">{name}</span>
            <span className="badge badge--outline badge--sm badge--num">
              {baseEnergy != null ? baseEnergy : '—'}
            </span>
          </div>
        );
      })}
    </div>
  </section>
));

AdditionalEnergy.displayName = 'AdditionalEnergy';

export default AdditionalEnergy;
