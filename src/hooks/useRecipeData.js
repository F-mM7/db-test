import { useFetchJson } from './useFetchJson';
import { RECIPE_DATA_URL } from '../utils/constants';

export function useRecipeData() {
  const { data: recipeData, loading, error } = useFetchJson(RECIPE_DATA_URL, []);
  return { recipeData, loading, error };
}
