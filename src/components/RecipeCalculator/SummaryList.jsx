import { memo } from 'react';
import RecipeRow from './RecipeRow';

const SummaryList = memo(({ recipes, onCountChange }) => (
  <div className="recipe-list">
    {recipes.map(recipe => (
      <RecipeRow
        key={recipe.name}
        variant="summary"
        recipe={recipe}
        count={recipe.count}
        onCountChange={onCountChange}
      />
    ))}
  </div>
));

SummaryList.displayName = 'SummaryList';

export default SummaryList;
