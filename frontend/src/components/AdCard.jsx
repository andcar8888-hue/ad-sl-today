import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../utils/images';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import FavouriteButton from './FavouriteButton';

export default function AdCard({ ad }) {
  const thumbnail = ad.images?.[0] ? resolveImageUrl(ad.images[0]) : null;

  return (
    // Note: overflow-hidden intentionally lives on the image wrapper below,
    // not on this outer card — clipping it here would cut off the visible
    // keyboard focus ring on the <Link> when it's tabbed to.
    <div className="group relative flex flex-col rounded-lg border border-border bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <FavouriteButton adId={ad._id} className="absolute right-1.5 top-1.5 z-10" />
      <Link to={`/ads/${ad._id}`} className="flex flex-1 flex-col rounded-lg">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg bg-surface-muted">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={ad.title}
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
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-3">
          <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-dark">
            {ad.category?.name || 'Uncategorized'}
          </span>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{ad.title}</h3>
          <span className="mt-auto pt-1 text-xs text-gray-500">
            {formatRelativeTime(ad.createdAt)}
          </span>
        </div>
      </Link>
    </div>
  );
}
