import { useEffect, useState } from 'react';
import { fetchCategories } from '../api/categories';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((data) => {
        if (active) setCategories(data.categories || []);
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { categories, loading, error };
}
