import { memo, useState, useCallback, useMemo } from 'react';
import { useRecipeData } from '../hooks/useRecipeData';
import { useRecipeCalculator, POT_SIZE_MIN, POT_SIZE_MAX } from '../hooks/useRecipeCalculator';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import './RecipeCalculator.css';

function RecipeCalculator() {
  const { recipeData, loading, error } = useRecipeData();
  const {
    selectedRecipes,
    totalIngredients,
    setRecipeCount,
    clearAll,
    categories,
    potSize,
    incrementPotSize,
    decrementPotSize,
    getFilteredRecipes
  } = useRecipeCalculator(recipeData);

  const [activeCategory, setActiveCategory] = useState(null);

  // カテゴリが読み込まれたら最初のカテゴリを選択
  const currentCategory = activeCategory || categories[0] || null;

  // フィルタ・ソート済み料理リスト
  const filteredRecipes = useMemo(
    () => getFilteredRecipes(currentCategory),
    [getFilteredRecipes, currentCategory]
  );

  // 選択中の料理数
  const selectedCount = Object.values(selectedRecipes).reduce((sum, c) => sum + c, 0);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="recipe-calculator-container">
      <header>
        <h1>料理カリキュレーター</h1>
        <p className="recipe-calculator-description">
          作りたい料理と回数を指定すると、必要な食材の合計数を算出します
        </p>
      </header>

      <FilterBar
        potSize={potSize}
        onIncrement={incrementPotSize}
        onDecrement={decrementPotSize}
      />

      <CategoryTabs
        categories={categories}
        activeCategory={currentCategory}
        onSelect={setActiveCategory}
      />

      <RecipeList
        recipes={filteredRecipes}
        selectedRecipes={selectedRecipes}
        onCountChange={setRecipeCount}
      />

      {totalIngredients.length > 0 && (
        <TotalResults
          totalIngredients={totalIngredients}
          selectedCount={selectedCount}
          onClear={clearAll}
        />
      )}
    </div>
  );
}

// 鍋サイズフィルター
const FilterBar = memo(({ potSize, onIncrement, onDecrement }) => (
  <div className="filter-bar">
    <div className="filter-group">
      <label className="filter-label">鍋のサイズ</label>
      <div className="pot-size-controls">
        <button
          className="pot-size-step-button"
          onClick={onDecrement}
          disabled={potSize <= POT_SIZE_MIN}
        >
          -
        </button>
        <span className="pot-size-value">{potSize}</span>
        <button
          className="pot-size-step-button"
          onClick={onIncrement}
          disabled={potSize >= POT_SIZE_MAX}
        >
          +
        </button>
      </div>
    </div>
  </div>
));

// カテゴリタブ
const CategoryTabs = memo(({ categories, activeCategory, onSelect }) => (
  <div className="category-tabs">
    {categories.map(category => (
      <button
        key={category}
        className={`category-tab ${activeCategory === category ? 'active' : ''}`}
        onClick={() => onSelect(category)}
      >
        {category}
      </button>
    ))}
  </div>
));

// 料理リスト
const RecipeList = memo(({ recipes, selectedRecipes, onCountChange }) => (
  <div className="recipe-list">
    {recipes.length === 0 ? (
      <div className="no-results">この鍋サイズで作れる料理はありません</div>
    ) : (
      recipes.map(recipe => (
        <RecipeRow
          key={recipe.name}
          recipe={recipe}
          count={selectedRecipes[recipe.name] || 0}
          onCountChange={onCountChange}
        />
      ))
    )}
  </div>
));

// 料理1行
const RecipeRow = memo(({ recipe, count, onCountChange }) => {
  const handleIncrement = useCallback(() => {
    onCountChange(recipe.name, count + 1);
  }, [onCountChange, recipe.name, count]);

  const handleDecrement = useCallback(() => {
    onCountChange(recipe.name, count - 1);
  }, [onCountChange, recipe.name, count]);

  return (
    <div className={`recipe-row ${count > 0 ? 'selected' : ''} ${recipe.weekendOnly ? 'weekend-only' : ''}`}>
      <span className="recipe-name">
        {recipe.name}
        {recipe.weekendOnly && <span className="weekend-badge">週末</span>}
      </span>
      <div className="recipe-meta">
        <span className="recipe-total-badge">計{recipe.totalIngredients}</span>
        <span className="recipe-energy-badge">{recipe.energy.toLocaleString()} En</span>
      </div>
      <div className="recipe-ingredients-summary">
        {recipe.ingredients.map(ing => (
          <span key={ing.name} className="recipe-ingredient-tag">
            {ing.name} x{ing.quantity}
          </span>
        ))}
      </div>
      <div className="recipe-count-control">
        <button
          className="count-button"
          onClick={handleDecrement}
          disabled={count <= 0}
        >
          -
        </button>
        <span className="count-display">{count}</span>
        <button className="count-button" onClick={handleIncrement}>
          +
        </button>
      </div>
    </div>
  );
});

// 合計結果セクション
const TotalResults = memo(({ totalIngredients, selectedCount, onClear }) => (
  <section>
    <div className="results-header">
      <h2>必要食材一覧</h2>
      <button className="clear-all-button" onClick={onClear}>
        すべてクリア
      </button>
    </div>

    <div className="total-ingredients-grid">
      {totalIngredients.map(({ name, quantity }) => (
        <div key={name} className="total-ingredient-card">
          <span className="total-ingredient-name">{name}</span>
          <span className="total-ingredient-quantity">{quantity}</span>
        </div>
      ))}
    </div>

    <div className="selected-recipes-summary">
      <span className="summary-count">{selectedCount}</span> 品の料理を選択中
    </div>
  </section>
));

FilterBar.displayName = 'FilterBar';
CategoryTabs.displayName = 'CategoryTabs';
RecipeList.displayName = 'RecipeList';
RecipeRow.displayName = 'RecipeRow';
TotalResults.displayName = 'TotalResults';

export default RecipeCalculator;
