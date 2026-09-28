import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../hooks/useCategories';
import { useFavourites } from '../hooks/useFavourites';
import NotificationBell from './NotificationBell';

// Heart icon + count badge linking straight to /favourites. Shown for EVERY
// visitor, not just logged-in ones — Favourites works for guests too via a
// localStorage "guest" namespace (see useFavourites/pages/Favourites.jsx),
// so gating this on isAuthenticated the way NotificationBell is (which
// genuinely needs a login) would incorrectly hide a guest's own favourites.
function FavouritesLink() {
  const { favouriteIds } = useFavourites();
  const count = favouriteIds.length;

  return (
    <Link
      to="/favourites"
      aria-label={count > 0 ? `Favourite ads (${count})` : 'Favourite ads'}
      className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-white/10 hover:text-primary-light"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={count > 0 ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.75"
        className={`h-5 w-5 ${count > 0 ? 'text-primary-light' : ''}`}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21s-6.716-4.35-9.428-8.06C.665 10.128 1.1 6.5 4.11 4.99c2.19-1.1 4.61-.4 5.89 1.36C11.28 4.59 13.7 3.89 15.89 4.99c3.01 1.51 3.445 5.14 1.538 7.95C18.716 16.65 12 21 12 21z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

// "admin_assistant" -> "Admin Assistant", "moderator" -> "Moderator", etc.
// Purely a display helper — never used for any permission decision.
function formatRoleLabel(role) {
  if (!role) return '';
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function Navbar() {
  const { user, isAuthenticated, isModerator, role, logout } = useAuth();
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
        <Link to="/" className="shrink-0 rounded" aria-label="AD SL Today — Home">
          <img
            src="/logo.png"
            alt="AD SL Today"
            className="h-9 w-auto sm:h-11"
          />
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
            cluster. NotificationBell is mounted ONCE, outside both the
            desktop-only (`hidden md:flex`) and mobile-only (`md:hidden`)
            children below — `hidden`/`md:hidden` only toggle CSS display,
            they never unmount a component, so a copy inside each of those
            would both stay mounted (and both keep polling) at every
            viewport width simultaneously. One bell, positioned between the
            two viewport-exclusive siblings, is reachable at every width
            without doubling the 30s unread-count polling. */}
        <div className="ml-auto flex items-center gap-1">
          <div className="hidden items-center gap-1 md:flex">
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

            {/* Visible to everyone, logged in or not — most useful to
                someone who hasn't posted an ad yet. */}
            <Link
              to="/how-to-publish"
              className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-primary-light"
            >
              How to Publish
            </Link>

            {/* flex-wrap: at cramped desktop widths just above the md
                breakpoint, this row (categories + 5-6 links + greeting/role
                pill + logout) can now run out of horizontal room with the
                role pill added — wrapping to a second line here reads as an
                intentional compact nav, not clipped/overflowing content. */}
            <nav className="flex flex-wrap items-center gap-1">
              {isAuthenticated ? (
                <>
                  <Link to="/post-ad" className="btn-primary min-h-9 px-3 py-2 text-sm">
                    Post an Ad
                  </Link>
                  <Link
                    to="/dashboard"
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-primary-light"
                  >
                    My Dashboard
                  </Link>
                  {isModerator && (
                    <Link
                      to="/admin"
                      className="rounded-md px-3 py-2 text-sm font-medium hover:bg-white/10 hover:text-primary-light"
                    >
                      Admin
                    </Link>
                  )}
                  <span className="whitespace-nowrap px-2 text-sm text-gray-300">
                    Hi, {user?.name?.split(' ')[0] || 'there'}
                    {/* Shows the logged-in admin-panel user's own role
                        somewhere visible. Only shown for moderator-tier and
                        above; a regular user's role is never interesting UI
                        chrome. whitespace-nowrap keeps "Admin Assistant"
                        from breaking mid-label if this whole cluster wraps. */}
                    {isModerator && (
                      <span className="ml-1.5 whitespace-nowrap rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-primary-light">
                        {formatRoleLabel(role)}
                      </span>
                    )}
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

          <FavouritesLink />
          {isAuthenticated && <NotificationBell />}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-2xl leading-none hover:bg-white/10 md:hidden"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
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
            <Link
              to="/how-to-publish"
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-2 py-3 hover:bg-white/10"
            >
              How to Publish
            </Link>
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
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-2 py-3 hover:bg-white/10"
                >
                  My Dashboard
                </Link>
                {isModerator && (
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
