import { memo } from 'react';
import { ingredientIconUrl } from '../../utils/constants';

const TotalResults = memo(({ totalIngredients, onClear, highlightedIngredients, onToggleHighlight }) => (
  <section>
    <div className="results-header">
      <h2>必要食材一覧</h2>
      <button className="btn btn-sm btn-danger" onClick={onClear}>
        すべてクリア
      </button>
    </div>

    <div className="total-ingredients-grid">
      {totalIngredients.map(({ name, quantity }) => {
        const isSelected = highlightedIngredients.has(name);
        return (
          <button
            key={name}
            type="button"
            className={`ingredient-card${isSelected ? ' selected' : ''}`}
            onClick={() => onToggleHighlight(name)}
          >
            <img
              className="icon-img ingredient-card__icon"
              src={ingredientIconUrl(name)}
              alt={name}
            />
            <span className="ingredient-card__name">{name}</span>
            <span className="badge badge--solid-green badge--lg">{quantity}</span>
          </button>
        );
      })}
    </div>
  </section>
));

TotalResults.displayName = 'TotalResults';

export default TotalResults;
