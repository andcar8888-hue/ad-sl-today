import { useEffect, useState } from 'react';
import { fetchAdById } from '../api/ads';
import { useFavourites } from '../hooks/useFavourites';
import AdCard from '../components/AdCard';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

export default function Favourites() {
  // Favourites are a client-side-only stand-in (localStorage) until a backend favourites endpoint exists.
  const { favouriteIds, removeFavourite } = useFavourites();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all(
      favouriteIds.map((id) =>
        fetchAdById(id)
          .then((data) => data.ad)
          .catch(() => null)
      )
    )
      .then((results) => {
        if (!active) return;
        const valid = results.filter(Boolean);
        setAds(valid);

        // Drop stale ids (ads that 404'd — e.g. expired/no longer approved).
        const validIds = new Set(valid.map((ad) => ad._id));
        favouriteIds.filter((id) => !validIds.has(id)).forEach((id) => removeFavourite(id));
      })
      .catch(() => {
        if (active) setError('Failed to load favourites.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favouriteIds.join(',')]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">My Favourites</h1>
      {error && <Alert variant="error">{error}</Alert>}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-gray-300" aria-hidden="true">
            <path d="M12 21s-6.716-4.35-9.428-8.06C.665 10.128 1.1 6.5 4.11 4.99c2.19-1.1 4.61-.4 5.89 1.36C11.28 4.59 13.7 3.89 15.89 4.99c3.01 1.51 3.445 5.14 1.538 7.95C18.716 16.65 12 21 12 21z" />
          </svg>
          <p>You haven&apos;t favourited any ads yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {ads.map((ad) => (
            <AdCard key={ad._id} ad={ad} />
          ))}
        </div>
      )}
    </div>
  );
}
