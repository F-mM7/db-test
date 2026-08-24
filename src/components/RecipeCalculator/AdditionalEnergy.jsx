import { memo, useCallback } from 'react';
import { ingredientIconUrl } from '../../utils/constants';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const FAVORITE_INGREDIENTS_KEY = 'pokesleep-kitchen:recipeCalculator:favoriteIngredients';

const AdditionalEnergy = memo(({ ingredients }) => {
  const [favoriteIngredients, setFavoriteIngredients] = useLocalStorage(FAVORITE_INGREDIENTS_KEY, []);

  const toggleFavorite = useCallback((name) => {
    setFavoriteIngredients(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }, [setFavoriteIngredients]);

  return (
    <section className="additional-energy-section">
      <div className="results-header">
        <h2>追加エナジー</h2>
        <span className="badge badge--outline">{ingredients.length} 種類</span>
      </div>

      <div className="additional-energy-grid">
        {ingredients.map(({ name, quantity, baseEnergy }) => {
          const isInTotal = quantity > 0;
          const isFavorite = favoriteIngredients.includes(name);
          const className = `ingredient-card${isInTotal ? ' ingredient-card--muted' : ''}`;
          return (
            <div key={name} className={className}>
              <button
                type="button"
                className={`favorite-star${isFavorite ? ' active' : ''}`}
                onClick={() => toggleFavorite(name)}
                aria-label={isFavorite ? `${name}をお気に入りから外す` : `${name}をお気に入りに追加`}
              >
                {isFavorite ? '★' : '☆'}
              </button>
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
  );
});

AdditionalEnergy.displayName = 'AdditionalEnergy';

export default AdditionalEnergy;
