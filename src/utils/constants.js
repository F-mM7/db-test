export const LV60_PATTERNS = ['AAA', 'AAC', 'ABB'];

export const DATA_URL = '/pokesleep-kitchen/pokemon-data.json';
export const RECIPE_DATA_URL = '/pokesleep-kitchen/recipe-data.json';
export const INGREDIENT_DATA_URL = '/pokesleep-kitchen/ingredient-data.json';

const BASE_URL = import.meta.env.BASE_URL;
export function ingredientIconUrl(name) {
  return `${BASE_URL}icons/${encodeURIComponent(name)}.png`;
}