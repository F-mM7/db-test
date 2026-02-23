import { memo, useState, useCallback, useMemo } from 'react';
import { useRecipeData } from '../hooks/useRecipeData';
import { useRecipeCalculator, POT_SIZE_MIN, POT_SIZE_MAX } from '../hooks/useRecipeCalculator';
import { ingredientIconUrl } from '../utils/constants';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import './RecipeCalculator.css';

const SUMMARY_TAB = '__summary__';

// 食材アイコン + 数量表示
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

  const [activeTab, setActiveTab] = useState(null);

  // デフォルトは最初のカテゴリ
  const currentTab = activeTab || categories[0] || null;
  const isSummaryTab = currentTab === SUMMARY_TAB;

  // フィルタ・ソート済み料理リスト
  const filteredRecipes = useMemo(
    () => isSummaryTab ? [] : getFilteredRecipes(currentTab),
    [getFilteredRecipes, currentTab, isSummaryTab]
  );

  // 選択中の料理数
  const selectedCount = Object.values(selectedRecipes).reduce((sum, c) => sum + c, 0);

  // 集計タブ用: 選択した料理の詳細リスト
  const selectedRecipeDetails = useMemo(() => {
    if (!isSummaryTab) return [];
    return Object.entries(selectedRecipes)
      .filter(([, count]) => count > 0)
      .map(([name, count]) => {
        const recipe = recipeData.find(r => r.name === name);
        return recipe ? { ...recipe, count } : null;
      })
      .filter(Boolean);
  }, [isSummaryTab, selectedRecipes, recipeData]);

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
        activeTab={currentTab}
        onSelect={setActiveTab}
        selectedCount={selectedCount}
      />

      {isSummaryTab ? (
        <SummaryList
          recipes={selectedRecipeDetails}
          onCountChange={setRecipeCount}
        />
      ) : (
        <RecipeList
          recipes={filteredRecipes}
          selectedRecipes={selectedRecipes}
          onCountChange={setRecipeCount}
        />
      )}

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
const CategoryTabs = memo(({ categories, activeTab, onSelect, selectedCount }) => (
  <div className="category-tabs">
    {categories.map(category => (
      <button
        key={category}
        className={`category-tab ${activeTab === category ? 'active' : ''}`}
        onClick={() => onSelect(category)}
      >
        {category}
      </button>
    ))}
    <button
      className={`category-tab summary-tab ${activeTab === SUMMARY_TAB ? 'active' : ''}`}
      onClick={() => onSelect(SUMMARY_TAB)}
    >
      集計
      {selectedCount > 0 && <span className="summary-tab-badge">{selectedCount}</span>}
    </button>
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
      <span className="recipe-name">{recipe.name}</span>
      <span className="recipe-weekend-cell">
        {recipe.weekendOnly && <span className="weekend-badge">週末</span>}
      </span>
      <div className="recipe-meta">
        <span className="recipe-total-badge">計{recipe.totalIngredients}</span>
        <span className="recipe-energy-badge">{recipe.energy.toLocaleString()} En</span>
      </div>
      <div className="recipe-ingredients-summary">
        {recipe.ingredients.map(ing => (
          <IngredientIcon key={ing.name} name={ing.name} quantity={ing.quantity} />
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

// 集計タブ: 選択中料理一覧
const SummaryList = memo(({ recipes, onCountChange }) => (
  <div className="recipe-list">
    {recipes.length === 0 ? (
      <div className="no-results">料理が選択されていません</div>
    ) : (
      recipes.map(recipe => (
        <SummaryRow
          key={recipe.name}
          recipe={recipe}
          onCountChange={onCountChange}
        />
      ))
    )}
  </div>
));

// 集計タブ: 料理1行（削除ボタン付き）
const SummaryRow = memo(({ recipe, onCountChange }) => {
  const handleIncrement = useCallback(() => {
    onCountChange(recipe.name, recipe.count + 1);
  }, [onCountChange, recipe.name, recipe.count]);

  const handleDecrement = useCallback(() => {
    onCountChange(recipe.name, recipe.count - 1);
  }, [onCountChange, recipe.name, recipe.count]);

  const handleRemove = useCallback(() => {
    onCountChange(recipe.name, 0);
  }, [onCountChange, recipe.name]);

  return (
    <div className="recipe-row selected">
      <span className="recipe-name">{recipe.name}</span>
      <span className="recipe-weekend-cell">
        <span className="summary-category-badge">{recipe.category}</span>
      </span>
      <div className="recipe-meta">
        <span className="recipe-total-badge">計{recipe.totalIngredients}</span>
        <span className="recipe-energy-badge">{recipe.energy.toLocaleString()} En</span>
      </div>
      <div className="recipe-ingredients-summary">
        {recipe.ingredients.map(ing => (
          <IngredientIcon key={ing.name} name={ing.name} quantity={ing.quantity * recipe.count} />
        ))}
      </div>
      <div className="recipe-count-control">
        <button
          className="count-button"
          onClick={handleDecrement}
          disabled={recipe.count <= 1}
        >
          -
        </button>
        <span className="count-display">{recipe.count}</span>
        <button className="count-button" onClick={handleIncrement}>
          +
        </button>
        <button className="remove-button" onClick={handleRemove}>
          &times;
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
          <img
            className="total-ingredient-icon"
            src={ingredientIconUrl(name)}
            alt={name}
          />
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
SummaryList.displayName = 'SummaryList';
SummaryRow.displayName = 'SummaryRow';
TotalResults.displayName = 'TotalResults';

export default RecipeCalculator;
