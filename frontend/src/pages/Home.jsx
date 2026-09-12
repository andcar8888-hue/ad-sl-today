import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAds } from '../api/ads';
import { useCategories } from '../hooks/useCategories';
import { useDebounce } from '../hooks/useDebounce';
import AdCard from '../components/AdCard';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { getErrorMessage } from '../utils/errors';

const PAGE_LIMIT = 12;

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories } = useCategories();

  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(searchInput, 450);
  const category = searchParams.get('category') || '';

  const [cityInput, setCityInput] = useState(searchParams.get('city') || '');
  const debouncedCity = useDebounce(cityInput, 450);

  // Mobile/tablet only — desktop always shows the sidebar (see `lg:hidden` below).
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [ads, setAds] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Keep the URL in sync with the debounced search text so results stay shareable.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedSearch) {
          next.set('search', debouncedSearch);
        } else {
          next.delete('search');
        }
        return next;
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Same pattern for the city filter, kept as its own effect/param so search
  // and city can be cleared/shared independently.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedCity) {
          next.set('city', debouncedCity);
        } else {
          next.delete('city');
        }
        return next;
      },
      { replace: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedCity]);

  const loadAds = useCallback(
    async (pageToLoad, { append } = {}) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const params = { page: pageToLoad, limit: PAGE_LIMIT };
        if (debouncedSearch) params.search = debouncedSearch;
        if (category) params.category = category;
        if (debouncedCity) params.city = debouncedCity;

        const data = await fetchAds(params);
        setAds((prev) => (append ? [...prev, ...data.ads] : data.ads));
        setPagination(data.pagination);
        setPage(pageToLoad);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [debouncedSearch, category, debouncedCity]
  );

  useEffect(() => {
    loadAds(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, category, debouncedCity]);

  const handleCategoryChange = (value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set('category', value);
      } else {
        next.delete('category');
      }
      return next;
    });
  };

  const hasActiveFilters = Boolean(category || cityInput);

  const clearFilters = () => {
    setCityInput('');
    handleCategoryChange('');
  };

  const hasMore = pagination && page < pagination.pages;

  // Shared between the desktop sidebar and the mobile "Filters" accordion so
  // both stay in sync without duplicating markup.
  const filterFields = (
    <>
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Category</h2>
        {/* "All Categories" stays pinned above the scroll area so it's always
            reachable without scrolling, even with a dozen+ categories. */}
        <button
          type="button"
          onClick={() => handleCategoryChange('')}
          className={`mt-2 w-full rounded-md px-2.5 py-2 text-left text-sm transition ${
            !category ? 'bg-primary text-white' : 'text-ink hover:bg-surface-muted'
          }`}
        >
          All Categories
        </button>
        <ul className="scrollbar-thin mt-1 max-h-72 space-y-1 overflow-y-auto pr-1 text-sm">
          {categories.map((cat) => (
            <li key={cat._id}>
              <button
                type="button"
                onClick={() => handleCategoryChange(cat._id)}
                className={`w-full rounded-md px-2.5 py-2 text-left transition ${
                  category === cat._id ? 'bg-primary text-white' : 'text-ink hover:bg-surface-muted'
                }`}
              >
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label htmlFor="city-filter" className="field-label">
          Area / ප්‍රදේශය
        </label>
        <input
          id="city-filter"
          type="text"
          value={cityInput}
          onChange={(event) => setCityInput(event.target.value)}
          placeholder="e.g. Colombo"
          className="input-field"
        />
      </div>

      {hasActiveFilters && (
        <button type="button" onClick={clearFilters} className="btn-ghost w-full justify-center text-sm">
          Clear Filters
        </button>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-ink px-5 py-8 text-white sm:px-8">
        <h1 className="text-2xl font-bold md:text-3xl">
          Sri Lanka&apos;s Family-Friendly <span className="text-primary-light">Classifieds</span>
        </h1>
        <p className="mt-1 text-sm text-gray-300">Buy, sell and find anything — safely and simply.</p>
        <p className="mt-1 text-sm text-gray-400">ආයුබෝවන්! අදම ඔබේ දැන්වීම පළ කරන්න.</p>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search ads by title or description..."
          aria-label="Search ads"
          className="input-field sm:flex-1"
        />
        {/* Desktop/wide screens use the always-visible sidebar instead of this toggle. */}
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          className="btn-secondary justify-center gap-2 lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filters
          {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />}
        </button>
      </section>

      {/* Mobile/tablet filter accordion — collapsed by default so it never
          pushes the ad grid far down the page. */}
      {filtersOpen && (
        <section className="space-y-4 rounded-lg border border-border bg-surface p-4 lg:hidden">
          {filterFields}
        </section>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-6">
        {/* Desktop sidebar — always visible from `lg` up. */}
        <aside className="hidden lg:block">
          <div className="h-fit space-y-4 rounded-lg border border-border bg-surface p-4">{filterFields}</div>
        </aside>

        <div>
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : ads.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-gray-300" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-3.5-3.5" />
              </svg>
              <p>No ads found. Try a different search, category or area.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {ads.map((ad) => (
                <AdCard key={ad._id} ad={ad} />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                type="button"
                onClick={() => loadAds(page + 1, { append: true })}
                disabled={loadingMore}
                className="btn-outline min-w-40"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
