import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../hooks/useCategories';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchValue.trim();
    navigate(trimmed ? `/?search=${encodeURIComponent(trimmed)}` : '/');
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-ink bg-ink text-white">
      <div className="flex w-full items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-10 xl:px-16">
        <Link to="/" className="shrink-0 rounded text-lg font-bold sm:text-xl">
          AD <span className="text-primary-light">SL</span> Today
        </Link>

        {/* Capped at max-w-xl so it doesn't balloon into a huge, sparse-looking
            input on very wide (1920px+) screens — it still grows/shrinks
            fluidly between md and that cap. */}
        <form onSubmit={handleSearchSubmit} className="hidden max-w-xl flex-1 md:flex">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search ads..."
            aria-label="Search ads"
            className="w-full min-w-0 rounded-l-md border border-transparent bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="rounded-r-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Search
          </button>
        </form>

        {/* Categories dropdown + nav links grouped into one right-aligned
            cluster (rather than each carrying its own margin) so they hug the
            edge as a single unit — the search form's max-w above is what
            creates the breathing room on wide screens, not stretching this
            cluster. */}
        <div className="ml-auto hidden items-center gap-1 md:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setCategoriesOpen((open) => !open)}
              aria-expanded={categoriesOpen}
              className="rounded-md px-2 py-2 text-sm font-medium hover:bg-white/10 hover:text-primary-light"
            >
              Categories
            </button>
            {categoriesOpen && (
              <div className="absolute right-0 z-30 mt-2 max-h-72 w-56 overflow-y-auto rounded-md border border-border bg-white py-1 text-ink shadow-lg">
                {categories.length === 0 && (
                  <p className="px-3 py-2 text-sm text-gray-500">No categories yet</p>
                )}
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    to={`/?category=${category._id}`}
                    onClick={() => setCategoriesOpen(false)}
                    className="block px-3 py-2 text-sm hover:bg-surface-muted"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <nav className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                <Link to="/post-ad" className="btn-primary min-h-9 px-3 py-2 text-sm">
                  Post an Ad
                </Link>
                <Link
                  to="/my-ads"
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-primary-light"
                >
                  My Ads
                </Link>
                <Link
                  to="/favourites"
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-primary-light"
                >
                  Favourites
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-primary-light"
                  >
                    Admin
                  </Link>
                )}
                <span className="px-2 text-sm text-gray-300">
                  Hi, {user?.name?.split(' ')[0] || 'there'}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-primary-light"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-primary-light"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary min-h-9 px-3 py-2 text-sm">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-2xl leading-none hover:bg-white/10 md:hidden"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="space-y-4 border-t border-white/10 px-4 py-4 md:hidden">
          <form onSubmit={handleSearchSubmit} className="flex">
            <input
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search ads..."
              aria-label="Search ads"
              className="w-full min-w-0 rounded-l-md border border-transparent bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="rounded-r-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Go
            </button>
          </form>

          {categories.length > 0 && (
            <div className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-gray-300">Categories</span>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    to={`/?category=${category._id}`}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 border-t border-white/10 pt-3 text-sm">
            {isAuthenticated ? (
              <>
                <Link
                  to="/post-ad"
                  onClick={() => setMenuOpen(false)}
                  className="btn-primary min-h-11 justify-center"
                >
                  Post an Ad
                </Link>
                <Link
                  to="/my-ads"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-3 hover:bg-white/10"
                >
                  My Ads
                </Link>
                <Link
                  to="/favourites"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-3 hover:bg-white/10"
                >
                  Favourites
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-2 py-3 hover:bg-white/10"
                  >
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md px-2 py-3 text-left hover:bg-white/10"
                >
                  Logout ({user?.name})
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-3 hover:bg-white/10"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="btn-primary min-h-11 justify-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
