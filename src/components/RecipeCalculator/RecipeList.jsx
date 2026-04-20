import { memo } from 'react';
import RecipeRow from './RecipeRow';

const RecipeList = memo(({ recipes, selectedRecipes, onCountChange }) => (
  <div className="recipe-list">
    {recipes.map(recipe => (
      <RecipeRow
        key={recipe.name}
        variant="list"
        recipe={recipe}
        count={selectedRecipes[recipe.name] || 0}
        onCountChange={onCountChange}
      />
    ))}
  </div>
));

RecipeList.displayName = 'RecipeList';

export default RecipeList;
