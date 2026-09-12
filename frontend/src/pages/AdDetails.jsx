import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchAdById } from '../api/ads';
import { resolveImageUrl } from '../utils/images';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import FavouriteButton from '../components/FavouriteButton';
import ContactActions from '../components/ContactActions';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { getErrorMessage } from '../utils/errors';
import { toWhatsAppDigits } from '../utils/phone';

export default function AdDetails() {
  const { id } = useParams();
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
  const telegramHandle = ad.telegramUsername ? ad.telegramUsername.replace(/^@/, '') : null;

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
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-dark">
              {ad.category?.name || 'Uncategorized'}
            </span>
            <h1 className="mt-2 text-xl font-bold text-ink sm:text-2xl">{ad.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Posted {formatRelativeTime(ad.createdAt)} by{' '}
              <span className="font-medium text-ink-light">{ad.user?.name || 'a user'}</span>
            </p>
          </div>

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-light">{ad.description}</p>

          {/* Desktop / tablet contact actions — hidden below md, replaced by the sticky bar. */}
          <div className="hidden pt-2 md:block">
            <ContactActions
              whatsappDigits={whatsappDigits}
              telegramHandle={telegramHandle}
              onShare={handleShare}
            />
            {copied && <p className="mt-2 text-xs font-medium text-green-700">Link copied to clipboard!</p>}
          </div>
        </div>
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
            onShare={handleShare}
            compact
          />
        </div>
      </div>
    </div>
  );
}
