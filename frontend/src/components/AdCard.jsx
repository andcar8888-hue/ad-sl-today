import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../utils/images';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import { truncateText } from '../utils/text';
import { toggleLikeAd } from '../api/ads';
import { useAuth } from '../context/AuthContext';
import FavouriteButton from './FavouriteButton';

// Maps an adType value to a human-readable label for the boost-tier badge.
const AD_TYPE_LABELS = {
  normal: 'Normal',
  featured: 'Featured',
  super: 'Super',
};

// Card-level border/ring treatment per tier. "normal" intentionally matches
// the pre-redesign look (plain border) — only featured/super get an accent,
// so the tier signal reads as "this one's boosted" rather than adding noise
// to every card.
const AD_TYPE_CARD_CLASSES = {
  normal: 'border border-border',
  featured: 'border border-border border-t-2 border-t-gold',
  super: 'border border-primary/50 ring-2 ring-primary',
};

/** Small star glyph shared by the featured/super tier badges. */
function TierStarIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2.5l2.7 6.06 6.6.62-4.98 4.42 1.47 6.47L12 16.9l-5.79 3.17 1.47-6.47-4.98-4.42 6.6-.62L12 2.5z" />
    </svg>
  );
}

export default function AdCard({ ad }) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // AdCard owns the like state locally (seeded from props) and updates it
  // optimistically on toggle, since the list page (Home.jsx) doesn't
  // refetch after a like.
  const [likes, setLikes] = useState(ad.likes || 0);
  const [likedBy, setLikedBy] = useState(ad.likedBy || []);
  const liked = Boolean(user?.id && likedBy.includes(user.id));

  // --- Auto-sliding image carousel -----------------------------------
  // Cycles ad.images every 2.5s when there's more than one photo; pauses
  // while the pointer hovers the image (desktop-only concept — touch
  // devices have no hover, so they just keep auto-cycling, which is fine).
  const images = ad.images || [];
  const hasMultipleImages = images.length > 1;
  const [currentSlide, setCurrentSlide] = useState(0);
  const isPausedRef = useRef(false);

  useEffect(() => {
    // Reset to the first slide whenever the underlying image set changes
    // (e.g. this card instance gets re-used for a different ad's images).
    setCurrentSlide(0);

    if (!ad.images || ad.images.length <= 1) {
      // Nothing to cycle — no interval, no wasted work.
      return undefined;
    }

    const intervalId = setInterval(() => {
      if (isPausedRef.current) return;
      setCurrentSlide((prev) => (prev + 1) % ad.images.length);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [ad.images]);

  const activeImagePath = images[currentSlide] ?? images[0] ?? null;
  const thumbnail = activeImagePath ? resolveImageUrl(activeImagePath) : null;

  const handleImageMouseEnter = () => {
    isPausedRef.current = true;
  };

  const handleImageMouseLeave = () => {
    isPausedRef.current = false;
  };

  // --- Like button -----------------------------------------------------
  const handleLikeClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Optimistic update, then reconcile with the server's authoritative
    // response (functional setState updates so we never read a stale
    // closure value of `likedBy`).
    const wasLiked = liked;
    setLikes((prev) => (wasLiked ? prev - 1 : prev + 1));
    setLikedBy((prev) => (wasLiked ? prev.filter((id) => id !== user.id) : [...prev, user.id]));

    try {
      const data = await toggleLikeAd(ad._id);
      setLikes(data.likes);
      setLikedBy((prev) =>
        data.liked
          ? prev.includes(user.id)
            ? prev
            : [...prev, user.id]
          : prev.filter((id) => id !== user.id)
      );
    } catch {
      // Revert the optimistic update on failure.
      setLikes((prev) => (wasLiked ? prev + 1 : prev - 1));
      setLikedBy((prev) => (wasLiked ? [...prev, user.id] : prev.filter((id) => id !== user.id)));
    }
  };

  const tierCardClass = AD_TYPE_CARD_CLASSES[ad.adType] || AD_TYPE_CARD_CLASSES.normal;

  return (
    // Note: overflow-hidden intentionally lives on the image wrapper below,
    // not on this outer card — clipping it here would cut off the visible
    // keyboard focus ring on the <Link> when it's tabbed to (also lets the
    // "super" tier ring render uncropped).
    <div
      className={`group relative flex flex-col rounded-lg bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tierCardClass}`}
    >
      <FavouriteButton adId={ad._id} className="absolute right-1.5 top-1.5 z-10" />
      <Link to={`/ads/${ad._id}`} className="flex flex-1 flex-col rounded-lg">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-surface-muted"
          onMouseEnter={handleImageMouseEnter}
          onMouseLeave={handleImageMouseLeave}
        >
          {/* Tier badge — only featured/super get one; normal stays clean. */}
          {ad.adType === 'super' && (
            <span className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
              <TierStarIcon className="h-3 w-3" />
              {AD_TYPE_LABELS.super}
            </span>
          )}
          {ad.adType === 'featured' && (
            <span className="absolute left-1.5 top-1.5 z-10 inline-flex items-center gap-1 rounded-full border border-gold bg-surface/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold shadow-sm">
              <TierStarIcon className="h-3 w-3" />
              {AD_TYPE_LABELS.featured}
            </span>
          )}

          {thumbnail ? (
            <img
              src={thumbnail}
              alt={hasMultipleImages ? `${ad.title} - photo ${currentSlide + 1} of ${images.length}` : ad.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-8 w-8"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5.5-5.5L9 17" />
              </svg>
              <span className="text-xs">No Image</span>
            </div>
          )}

          {/* Slide dots — purely informational, no touch/swipe handling. */}
          {hasMultipleImages && (
            <div className="pointer-events-none absolute inset-x-0 bottom-1.5 z-10 flex items-center justify-center">
              <div className="flex items-center gap-1 rounded-full bg-black/30 px-1.5 py-1">
                {images.map((_, index) => (
                  <span
                    key={index}
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full transition ${
                      index === currentSlide ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-dark">
              {ad.category?.name || 'Uncategorized'}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{ad.title}</h3>
          {ad.description && (
            <p className="line-clamp-2 text-xs text-gray-500">{truncateText(ad.description, 100)}</p>
          )}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2">
            <span className="truncate text-[11px] text-gray-500">{formatRelativeTime(ad.createdAt)}</span>
            <div className="flex shrink-0 items-center gap-1">
              {/* Views — static, non-interactive. */}
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                  />
                  <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {ad.views ?? 0}
              </span>
              {/* Like — clickable heart, guests are redirected to /login.
                  min-h-8 (32px) keeps the tap target comfortable even
                  though the visual icon+count is small. */}
              <button
                type="button"
                onClick={handleLikeClick}
                aria-pressed={liked}
                aria-label={liked ? 'Unlike this ad' : 'Like this ad'}
                className="inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-gray-500 transition hover:bg-primary/5 hover:text-primary active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={liked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`h-3.5 w-3.5 ${liked ? 'text-primary' : ''}`}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21s-6.716-4.35-9.428-8.06C.665 10.128 1.1 6.5 4.11 4.99c2.19-1.1 4.61-.4 5.89 1.36C11.28 4.59 13.7 3.89 15.89 4.99c3.01 1.51 3.445 5.14 1.538 7.95C18.716 16.65 12 21 12 21z"
                  />
                </svg>
                {likes}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
