import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resolveImageUrl } from '../utils/images';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import { truncateText } from '../utils/text';
import { toggleLikeAd } from '../api/ads';
import { useAuth } from '../context/AuthContext';
import FavouriteButton from './FavouriteButton';

// Card-level border treatment for a boosted ad vs. a plain one — a full,
// always-visible colored border on EVERY card (not just an accent limited to
// boosted ones), so the tier reads at a glance across the whole grid.
// AdLevels are fully admin-configurable (name/price can change at any time),
// so this never keys off a level's *name* — only off the server-computed
// `ad.boostActive` flag, with a gold/red two-way split keyed off whether the
// level is time-limited (`durationDays` set) — the one structural signal the
// backend actually models for "flashier, time-boxed boost" vs. a steady one.
// `border-gray-300` (not `--color-border`, which reads a hair too faint once
// it's a full 2px edge rather than a thin 1px hairline) for the neutral,
// non-boosted case.
const TIER_BORDER_CLASS_NORMAL = 'border-2 border-gray-300';
const TIER_BORDER_CLASS_GOLD = 'border-2 border-gold';
const TIER_BORDER_CLASS_RED = 'border-2 border-primary';

// Matching treatment for the top-left tier badge — same red/gold/neutral
// split as the border above, so the border and the badge always agree.
const TIER_BADGE_CLASS_NORMAL = 'border border-border bg-surface-muted text-gray-600';
const TIER_BADGE_CLASS_GOLD = 'border border-gold bg-white text-gold';
const TIER_BADGE_CLASS_RED = 'bg-primary text-white';

/** Small star glyph used for the non-time-limited (gold) boosted-tier badge. */
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

/** Small bolt glyph used for the time-limited (red) boosted-tier badge —
 * reads as the more urgent/flashier boost. */
function TierBoltIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z" />
    </svg>
  );
}

/** Warning-triangle glyph for the "Fake Ad" safety badge — uses
 * --color-warning (amber), never --color-gold/--color-primary, so it can
 * never be visually mistaken for a paid boost tier. */
function WarningTriangleIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className={className}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4m0 3.5h.01M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.3 2.25h17.76a1.5 1.5 0 0 0 1.3-2.25L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z"
      />
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

  // `boostActive` already accounts for time-limited levels expiring
  // (server-computed) — durationDays being set just picks which of the two
  // boosted visual treatments to use, never whether it's boosted at all.
  const isBoosted = Boolean(ad.boostActive && ad.adLevel?.name);
  const isTimeLimitedBoost = isBoosted && Boolean(ad.adLevel?.durationDays);
  const tierBorderClass = !isBoosted
    ? TIER_BORDER_CLASS_NORMAL
    : isTimeLimitedBoost
      ? TIER_BORDER_CLASS_RED
      : TIER_BORDER_CLASS_GOLD;
  const tierBadgeClass = !isBoosted
    ? TIER_BADGE_CLASS_NORMAL
    : isTimeLimitedBoost
      ? TIER_BADGE_CLASS_RED
      : TIER_BADGE_CLASS_GOLD;

  return (
    // Note: overflow-hidden intentionally lives on the thumbnail wrapper
    // below, not on this outer card — clipping it here would cut off the
    // visible keyboard focus ring on the <Link> when it's tabbed to.
    <div
      className={`group relative flex flex-col gap-2 rounded-lg bg-surface p-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-3 ${tierBorderClass}`}
    >
      <Link to={`/ads/${ad._id}`} className="flex flex-1 flex-col gap-2">
        {/* Top meta row: safety/tier badges on the left, like + views + time
            on the right — sits above the thumbnail/text row below it. */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col items-start gap-1">
            {/* Fake Ad safety warning always sits above the tier badge —
                user safety outranks tier promotion, so it gets the more
                prominent top slot and its own unmistakable amber-warning
                color (never the gold "featured" color). */}
            {ad.isFake && (
              <span className="inline-flex items-center gap-1 rounded-md bg-warning px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
                <WarningTriangleIcon className="h-3 w-3" />
                Fake Ad
              </span>
            )}
            {/* Tier badge — now shown on every card, including the
                non-boosted "Normal" tier, so tier is legible at a glance
                across the whole grid. Label text always comes from the
                admin-configurable AdLevel name, never a hardcoded string
                like "Normal"/"Featured"/"Top Ad". */}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tierBadgeClass}`}
            >
              {isBoosted ? (
                isTimeLimitedBoost ? (
                  <TierBoltIcon className="h-3 w-3" />
                ) : (
                  <TierStarIcon className="h-3 w-3" />
                )
              ) : null}
              {ad.adLevel?.name}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
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
            <span className="truncate text-[11px] text-gray-500">{formatRelativeTime(ad.createdAt)}</span>
          </div>
        </div>

        {/* Thumbnail (left) + title/excerpt (right) — the horizontal body
            of the card. */}
        <div className="flex gap-3 sm:gap-4">
          <div
            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-surface-muted sm:h-28 sm:w-28"
            onMouseEnter={handleImageMouseEnter}
            onMouseLeave={handleImageMouseLeave}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={hasMultipleImages ? `${ad.title} - photo ${currentSlide + 1} of ${images.length}` : ad.title}
                loading="lazy"
                className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="9" cy="10" r="2" />
                  <path d="M21 16l-5.5-5.5L9 17" />
                </svg>
                <span className="text-[9px]">No Image</span>
              </div>
            )}

            {/* Slide dots — purely informational, no touch/swipe handling. */}
            {hasMultipleImages && (
              <div className="pointer-events-none absolute inset-x-0 bottom-1 z-10 flex items-center justify-center">
                <div className="flex items-center gap-0.5 rounded-full bg-black/30 px-1 py-0.5">
                  {images.map((_, index) => (
                    <span
                      key={index}
                      aria-hidden="true"
                      className={`h-1 w-1 rounded-full transition ${
                        index === currentSlide ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* FavouriteButton is a SEPARATE, unrelated bookmark feature
                (client-side localStorage — nothing to do with the like/view
                counts above). Mounted on the thumbnail's corner rather than
                the top-right meta row so its circular white floating-button
                style stays physically apart from the flatter inline
                like-heart control — the two hearts sit in different
                territory of the card and can't be confused for one another.
                `scale-75` is a transform, so it shrinks the button to fit
                the smaller thumbnail (~33px, still a comfortable tap target)
                without fighting the component's own h-11/w-11 sizing
                classes. */}
            <FavouriteButton adId={ad._id} className="absolute right-1 top-1 z-10 scale-75" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-dark">
              {ad.category?.name || 'Uncategorized'}
            </span>
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-ink sm:text-base">{ad.title}</h3>
            {ad.description && (
              <p className="line-clamp-2 text-xs text-gray-500 sm:line-clamp-3">{truncateText(ad.description, 100)}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
