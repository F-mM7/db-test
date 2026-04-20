import { useState, useMemo } from 'react';
import { useFetchJson } from '../hooks/useFetchJson';
import { useRecipeCalculator } from '../hooks/useRecipeCalculator';
import { RECIPE_DATA_URL, INGREDIENT_DATA_URL } from '../utils/constants';
import AsyncBoundary from './AsyncBoundary';
import FilterBar from './RecipeCalculator/FilterBar';
import CategoryTabs, { SUMMARY_TAB } from './RecipeCalculator/CategoryTabs';
import RecipeList from './RecipeCalculator/RecipeList';
import SummaryList from './RecipeCalculator/SummaryList';
import TotalResults from './RecipeCalculator/TotalResults';
import MissingIngredients from './RecipeCalculator/MissingIngredients';
import './RecipeCalculator.css';

function RecipeCalculator() {
  const { data: recipeData, loading: recipeLoading, error: recipeError } = useFetchJson(RECIPE_DATA_URL);
  const { data: ingredientData, loading: ingredientLoading, error: ingredientError } = useFetchJson(INGREDIENT_DATA_URL);
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

  const currentTab = activeTab || categories[0] || null;
  const isSummaryTab = currentTab === SUMMARY_TAB;

  const filteredRecipes = useMemo(
    () => isSummaryTab ? [] : getFilteredRecipes(currentTab),
    [getFilteredRecipes, currentTab, isSummaryTab]
  );

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
    <AsyncBoundary loading={recipeLoading || ingredientLoading} error={recipeError || ingredientError}>
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

export default RecipeCalculator;
