import { useState, useEffect } from 'react';

export function useFetchJson(url, initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        setData(json);
      } catch (err) {
        console.error(`Failed to load data from ${url}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [url]);

  return { data, loading, error };
}
