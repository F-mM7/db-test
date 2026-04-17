import { useState, useEffect } from 'react';
import { INGREDIENT_DATA_URL } from '../utils/constants';

export function useIngredientData() {
  const [ingredientData, setIngredientData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(INGREDIENT_DATA_URL);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setIngredientData(data);
      } catch (err) {
        console.error('Failed to load ingredient data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { ingredientData, loading, error };
}
