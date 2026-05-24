import { memo } from 'react';
import RecipeRow from './RecipeRow';

// variant ごとの空文言（list: 鍋サイズ起因 / summary: 未選択）
const EMPTY_MESSAGES = {
  list: 'この鍋サイズで作れる料理はありません',
  summary: '料理が選択されていません'
};

const RecipeList = memo(({ variant, recipes, selectedRecipes, onCountChange }) => {
  if (recipes.length === 0) {
    return <p>{EMPTY_MESSAGES[variant]}</p>;
  }

  const isSummary = variant === 'summary';

  return (
    <div className="recipe-list">
      {recipes.map(recipe => (
        <RecipeRow
          key={recipe.name}
          variant={variant}
          recipe={recipe}
          count={isSummary ? recipe.count : (selectedRecipes[recipe.name] || 0)}
          onCountChange={onCountChange}
        />
      ))}
    </div>
  );
});

RecipeList.displayName = 'RecipeList';

export default RecipeList;
