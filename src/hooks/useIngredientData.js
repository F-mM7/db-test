import { useFetchJson } from './useFetchJson';
import { INGREDIENT_DATA_URL } from '../utils/constants';

export function useIngredientData() {
  const { data: ingredientData, loading, error } = useFetchJson(INGREDIENT_DATA_URL, []);
  return { ingredientData, loading, error };
}
