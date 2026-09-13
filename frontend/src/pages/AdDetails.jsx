import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchAdById, toggleLikeAd } from '../api/ads';
import { resolveImageUrl } from '../utils/images';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import FavouriteButton from '../components/FavouriteButton';
import ContactActions from '../components/ContactActions';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { getErrorMessage } from '../utils/errors';
import { toWhatsAppDigits, toE164 } from '../utils/phone';
import { useAuth } from '../context/AuthContext';

/** Small bolt glyph for the time-limited (red) boosted-tier badge — mirrors
 * AdCard.jsx's tier badge treatment for consistency between listing and
 * detail views. */
function TierBoltIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z" />
    </svg>
  );
}

/** Small star glyph for the non-time-limited (gold) boosted-tier badge. */
function TierStarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5l2.7 6.06 6.6.62-4.98 4.42 1.47 6.47L12 16.9l-5.79 3.17 1.47-6.47-4.98-4.42 6.6-.62L12 2.5z" />
    </svg>
  );
}

/** Warning-triangle glyph for the "Fake Ad" safety badge — uses
 * --color-warning (amber), never --color-gold/--color-primary, so it can
 * never be visually mistaken for a paid boost tier. */
function WarningTriangleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v4m0 3.5h.01M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.3 2.25h17.76a1.5 1.5 0 0 0 1.3-2.25L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z"
      />
    </svg>
  );
}

export default function AdDetails() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ad, setAd] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchAdById(id)
      .then((data) => {
        if (!active) return;
        setAd(data.ad);
        setActiveImage(0);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const handleShare = async () => {
    const shareData = { title: ad?.title, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled the native share sheet — nothing to do.
      }
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Like toggle — guests are redirected to /login instead of calling the
  // API. On success, `ad.likes`/`ad.likedBy` are updated from the response
  // so the count/fill state reflect the new server-side truth immediately.
  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const data = await toggleLikeAd(ad._id);
      setAd((prev) => ({
        ...prev,
        likes: data.likes,
        likedBy: data.liked
          ? [...(prev.likedBy || []).filter((likeId) => likeId !== user.id), user.id]
          : (prev.likedBy || []).filter((likeId) => likeId !== user.id),
      }));
    } catch {
      // Silently ignore — the like count simply won't update; no need to
      // surface a hard error for a non-critical toggle action.
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <Alert variant="error">{error || 'Ad not found.'}</Alert>
        <Link to="/" className="mt-4 inline-block font-medium text-primary hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const images = ad.images && ad.images.length > 0 ? ad.images : [];
  const whatsappDigits = toWhatsAppDigits(ad.whatsappNumber);
  const telHref = toE164(ad.whatsappNumber);
  const telegramHandle = ad.telegramUsername ? ad.telegramUsername.replace(/^@/, '') : null;
  const liked = Boolean(user?.id && ad.likedBy?.includes(user.id));
  // Mirrors AdCard.jsx's tiering logic: `boostActive` already accounts for
  // time-limited levels expiring (server-computed); durationDays being set
  // just picks which of the two boosted visual treatments to use.
  const isBoosted = Boolean(ad.boostActive && ad.adLevel?.name);
  const isTimeLimitedBoost = isBoosted && Boolean(ad.adLevel?.durationDays);

  return (
    <div className="pb-20 md:pb-0">
      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-surface-muted">
            {images.length > 0 ? (
              <img
                src={resolveImageUrl(images[activeImage])}
                alt={`${ad.title} - image ${activeImage + 1} of ${images.length}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-gray-500">No Image</div>
            )}
            <FavouriteButton adId={ad._id} className="absolute right-3 top-3" />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1} of ${images.length}`}
                  aria-current={index === activeImage}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${
                    index === activeImage ? 'border-primary' : 'border-border opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={resolveImageUrl(image)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Fake ad safety warning — placed first, ahead of both the
                  category pill and the tier badge, since user safety
                  outranks tier promotion in reading order too. */}
              {ad.isFake && (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink shadow-sm">
                  <WarningTriangleIcon className="h-3.5 w-3.5" />
                  Fake Ad
                </span>
              )}
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-dark">
                {ad.category?.name || 'Uncategorized'}
              </span>
              {/* Boosted-tier badge — only shown while the boost is actually
                  active (server-computed via ad.boostActive, which already
                  accounts for time-limited levels expiring). Label text
                  comes from the admin-configurable AdLevel name, never a
                  hardcoded tier string. Solid red for time-limited
                  (flashier) boosts, gold-outlined for non-time-limited
                  (steady) boosts — mirrors AdCard.jsx's listing badge. */}
              {isBoosted && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    isTimeLimitedBoost ? 'bg-primary text-white' : 'border border-gold text-gold'
                  }`}
                >
                  {isTimeLimitedBoost ? (
                    <TierBoltIcon className="h-3.5 w-3.5" />
                  ) : (
                    <TierStarIcon className="h-3.5 w-3.5" />
                  )}
                  {ad.adLevel.name}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-xl font-bold text-ink sm:text-2xl">{ad.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
              <p>
                Posted {formatRelativeTime(ad.createdAt)} by{' '}
                <span className="font-medium text-ink-light">{ad.user?.name || 'a user'}</span>
              </p>
              <span aria-hidden="true">&middot;</span>
              <span>{ad.views ?? 0} views</span>
              <span aria-hidden="true">&middot;</span>
              <button
                type="button"
                onClick={handleLikeClick}
                aria-pressed={liked}
                aria-label={liked ? 'Unlike this ad' : 'Like this ad'}
                className="flex items-center gap-1 hover:text-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={liked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`h-4 w-4 ${liked ? 'text-primary' : ''}`}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21s-6.716-4.35-9.428-8.06C.665 10.128 1.1 6.5 4.11 4.99c2.19-1.1 4.61-.4 5.89 1.36C11.28 4.59 13.7 3.89 15.89 4.99c3.01 1.51 3.445 5.14 1.538 7.95C18.716 16.65 12 21 12 21z"
                  />
                </svg>
                {ad.likes ?? 0}
              </button>
            </div>
          </div>

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-light">{ad.description}</p>

          {/* Desktop / tablet contact actions — hidden below md, replaced by the sticky bar. */}
          <div className="hidden pt-2 md:block">
            <ContactActions
              whatsappDigits={whatsappDigits}
              telegramHandle={telegramHandle}
              telHref={telHref}
              onShare={handleShare}
            />
            {copied && <p className="mt-2 text-xs font-medium text-green-700">Link copied to clipboard!</p>}
          </div>
        </div>
      </div>

      {/* Liability disclaimer — AD SL Today only provides the platform to
          post ads; it takes no responsibility for the actual transaction
          between the poster and the buyer. */}
      <div className="mt-6 rounded-lg border border-border bg-surface-muted/60 p-4 text-xs leading-relaxed text-gray-600 sm:text-sm">
        <p className="font-semibold text-ink">වැදගත් සටහන</p>
        <p className="mt-1">
          දැන්වීම පළ කරන්නා සහ ගැනුම්කරු අතර සිදුවන කිසිදු ගනුදෙනුවක වගකීමක් AD SL Today විසින් භාර
          නොගනු ලැබේ. අප සපයනු ලබන්නේ දැන්වීම් පළ කිරීමේ අවස්ථාව පමණි.
        </p>
      </div>

      {/* Mobile sticky contact bar — keeps the primary actions reachable
          without scrolling back up, since most users browse on phones. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        {copied && (
          <p className="mb-2 text-center text-xs font-medium text-green-700">Link copied to clipboard!</p>
        )}
        <div className="flex items-center gap-2">
          <FavouriteButton adId={ad._id} className="!bg-surface-muted !shadow-none" />
          <ContactActions
            whatsappDigits={whatsappDigits}
            telegramHandle={telegramHandle}
            telHref={telHref}
            onShare={handleShare}
            compact
          />
        </div>
      </div>
    </div>
  );
}
