import { useState, useEffect } from 'react';
import { RECIPE_DATA_URL } from '../utils/constants';

export function useRecipeData() {
  const [recipeData, setRecipeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(RECIPE_DATA_URL);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setRecipeData(data);
      } catch (err) {
        console.error('Failed to load recipe data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { recipeData, loading, error };
}
