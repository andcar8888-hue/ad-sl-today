import { useEffect, useState } from 'react';
import { fetchAdLevels } from '../api/adLevels';

export function useAdLevels() {
  const [adLevels, setAdLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchAdLevels()
      .then((data) => {
        if (active) setAdLevels(data.levels || []);
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

  return { adLevels, loading, error };
}
