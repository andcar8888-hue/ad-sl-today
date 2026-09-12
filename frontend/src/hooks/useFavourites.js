import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Favourites are a client-side-only stand-in (localStorage, namespaced per
// user) until a backend favourites endpoint exists.
function storageKeyFor(userId) {
  return `favourites:${userId || 'guest'}`;
}

function readIds(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useFavourites() {
  const { user } = useAuth();
  const key = storageKeyFor(user?.id);
  const [ids, setIds] = useState(() => readIds(key));

  useEffect(() => {
    setIds(readIds(key));
  }, [key]);

  const isFavourite = useCallback((adId) => ids.includes(adId), [ids]);

  const toggleFavourite = useCallback(
    (adId) => {
      setIds((prev) => {
        const next = prev.includes(adId) ? prev.filter((id) => id !== adId) : [...prev, adId];
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  const removeFavourite = useCallback(
    (adId) => {
      setIds((prev) => {
        if (!prev.includes(adId)) return prev;
        const next = prev.filter((id) => id !== adId);
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  return { favouriteIds: ids, isFavourite, toggleFavourite, removeFavourite };
}
