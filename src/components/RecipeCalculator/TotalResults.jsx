import { memo } from 'react';
import { ingredientIconUrl } from '../../utils/constants';

const TotalResults = memo(({ totalIngredients, selectedCount, onClear }) => (
  <section>
    <div className="results-header">
      <h2>必要食材一覧</h2>
      <button className="btn btn-sm btn-danger" onClick={onClear}>
        すべてクリア
      </button>
    </div>

    <div className="total-ingredients-grid">
      {totalIngredients.map(({ name, quantity }) => (
        <div key={name} className="ingredient-card">
          <img
            className="ingredient-card__icon"
            src={ingredientIconUrl(name)}
            alt={name}
          />
          <span className="ingredient-card__name">{name}</span>
          <span className="total-ingredient-quantity badge badge--solid-green badge--lg">{quantity}</span>
        </div>
      ))}
    </div>

    <div className="selected-recipes-summary">
      <span className="summary-count">{selectedCount}</span> 品の料理を選択中
    </div>
  </section>
));

TotalResults.displayName = 'TotalResults';

export default TotalResults;
