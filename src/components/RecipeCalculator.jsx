import { memo, useState, useMemo } from 'react';
import { useFetchJson } from '../hooks/useFetchJson';
import { useRecipeCalculator, POT_SIZE_MIN, POT_SIZE_MAX } from '../hooks/useRecipeCalculator';
import { ingredientIconUrl, RECIPE_DATA_URL, INGREDIENT_DATA_URL } from '../utils/constants';
import AsyncBoundary from './AsyncBoundary';
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
  const { data: recipeData, loading, error } = useFetchJson(RECIPE_DATA_URL, []);
  const { data: ingredientData } = useFetchJson(INGREDIENT_DATA_URL, []);
  const {
    selectedRecipes,
    totalIngredients,
    missingIngredients,
    setRecipeCount,
    clearAll,
    categories,
    potSize,
    incrementPotSize,
    decrementPotSize,
    getFilteredRecipes
  } = useRecipeCalculator(recipeData, ingredientData);

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

  return (
    <AsyncBoundary loading={loading} error={error}>
      <div className="page-container recipe-calculator-container">
        <header>
          <h1 className="page-title">料理カリキュレーター</h1>
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

        {isSummaryTab && missingIngredients.length > 0 && (
          <MissingIngredients ingredients={missingIngredients} />
        )}
      </div>
    </AsyncBoundary>
  );
}

// 鍋サイズフィルター
const FilterBar = memo(({ potSize, onIncrement, onDecrement }) => (
  <div className="filter-bar">
    <div className="filter-group">
      <label className="filter-label">鍋のサイズ</label>
      <div className="pot-size-controls">
        <button
          className="icon-btn icon-btn-step"
          onClick={onDecrement}
          disabled={potSize <= POT_SIZE_MIN}
        >
          -
        </button>
        <span className="pot-size-value">{potSize}</span>
        <button
          className="icon-btn icon-btn-step"
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
        className={`category-tab tab ${activeTab === category ? 'active' : ''}`}
        onClick={() => onSelect(category)}
      >
        {category}
      </button>
    ))}
    <button
      className={`category-tab summary-tab tab ${activeTab === SUMMARY_TAB ? 'active' : ''}`}
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
          variant="list"
          recipe={recipe}
          count={selectedRecipes[recipe.name] || 0}
          onCountChange={onCountChange}
        />
      ))
    )}
  </div>
));

// 集計タブ: 選択中料理一覧
const SummaryList = memo(({ recipes, onCountChange }) => (
  <div className="recipe-list">
    {recipes.length === 0 ? (
      <div className="no-results">料理が選択されていません</div>
    ) : (
      recipes.map(recipe => (
        <RecipeRow
          key={recipe.name}
          variant="summary"
          recipe={recipe}
          count={recipe.count}
          onCountChange={onCountChange}
        />
      ))
    )}
  </div>
));

// 料理1行（list / summary 両対応）
const RecipeRow = memo(({ variant, recipe, count, onCountChange }) => {
  const isSummary = variant === 'summary';
  const rowClassName = !isSummary && count > 0 ? 'recipe-row selected' : 'recipe-row';
  const decrementDisabled = isSummary ? count <= 1 : count <= 0;

  return (
    <div className={rowClassName}>
      <span className="recipe-name">{recipe.name}</span>
      <span className="recipe-weekend-cell">
        {isSummary ? (
          <span className="summary-category-badge">{recipe.category}</span>
        ) : (
          recipe.weekendOnly && <span className="weekend-badge">週末</span>
        )}
      </span>
      <span className="recipe-total-badge">計{recipe.totalIngredients}</span>
      <span className="recipe-energy-badge">{recipe.energy.toLocaleString()} En</span>
      <div className="recipe-ingredients-summary">
        {recipe.ingredients.map(ing => (
          <IngredientIcon
            key={ing.name}
            name={ing.name}
            quantity={isSummary ? ing.quantity * count : ing.quantity}
          />
        ))}
      </div>
      <div className="recipe-count-control">
        <button
          className="icon-btn icon-btn-count"
          onClick={() => onCountChange(recipe.name, count - 1)}
          disabled={decrementDisabled}
        >
          -
        </button>
        <span className="count-display">{count}</span>
        <button
          className="icon-btn icon-btn-count"
          onClick={() => onCountChange(recipe.name, count + 1)}
        >
          +
        </button>
        {isSummary && (
          <button
            className="icon-btn icon-btn-remove"
            onClick={() => onCountChange(recipe.name, 0)}
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
});

// 合計結果セクション
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

// 集計に含まれていない食材セクション（基礎エナジー降順）
const MissingIngredients = memo(({ ingredients }) => (
  <section className="missing-ingredients-section">
    <div className="results-header">
      <h2>集計にない食材</h2>
      <span className="missing-ingredients-count">{ingredients.length} 種類</span>
    </div>

    <div className="missing-ingredients-grid">
      {ingredients.map(({ name, baseEnergy }) => (
        <div key={name} className="missing-ingredient-card">
          <img
            className="missing-ingredient-icon"
            src={ingredientIconUrl(name)}
            alt={name}
          />
          <span className="missing-ingredient-name">{name}</span>
          <span className="missing-ingredient-energy">
            {baseEnergy != null ? baseEnergy : '—'}
          </span>
        </div>
      ))}
    </div>
  </section>
));

FilterBar.displayName = 'FilterBar';
CategoryTabs.displayName = 'CategoryTabs';
RecipeList.displayName = 'RecipeList';
SummaryList.displayName = 'SummaryList';
RecipeRow.displayName = 'RecipeRow';
TotalResults.displayName = 'TotalResults';
MissingIngredients.displayName = 'MissingIngredients';

export default RecipeCalculator;
