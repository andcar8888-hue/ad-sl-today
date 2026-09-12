import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyAds } from '../api/ads';
import { resolveImageUrl } from '../utils/images';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import StatusBadge from '../components/StatusBadge';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { getErrorMessage } from '../utils/errors';

// Shown for an ad still awaiting payment confirmation, so the owner can get
// back to the bank details + user code without digging through WhatsApp history.
function needsCheckoutLink(ad) {
  return ad.status === 'pending_payment' && ad.orderStatus !== 'confirmed';
}

// The user code, in the same bold monospace treatment Checkout.jsx uses —
// this is the piece of info the owner is most likely to come back looking for.
function UserCode({ ad }) {
  if (!ad.userCode) {
    return <span className="font-mono text-sm text-gray-500">—</span>;
  }
  return (
    <span className="font-mono text-base font-extrabold tracking-wide text-primary">
      {ad.userCode}
    </span>
  );
}

export default function MyAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetchMyAds()
      .then((data) => {
        if (active) setAds(data.ads || []);
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
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">My Ads</h1>
        <p className="text-sm text-gray-500">ඔබ පළ කළ දැන්වීම් සියල්ල මෙහි දැක්වේ.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-gray-300" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path strokeLinecap="round" d="M7 9h10M7 13h6" />
          </svg>
          <p>You haven&apos;t posted any ads yet.</p>
          <Link to="/post-ad" className="btn-primary mt-2">
            Post an Ad
          </Link>
        </div>
      ) : (
        <>
          {/* Card layout below md — easier to scan/tap than a squeezed table. */}
          <div className="space-y-3 md:hidden">
            {ads.map((ad) => {
              const thumbnail = ad.images?.[0] ? resolveImageUrl(ad.images[0]) : null;
              return (
                <div key={ad._id} className="flex gap-3 rounded-lg border border-border bg-surface p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                    {thumbnail ? (
                      <img src={thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold text-ink">{ad.title}</h3>
                      <StatusBadge status={ad.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {ad.category?.name || 'Uncategorized'}
                      {ad.city ? ` · ${ad.city}` : ''} · {formatRelativeTime(ad.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      User code: <UserCode ad={ad} />
                    </p>
                    {needsCheckoutLink(ad) && (
                      <Link to={`/checkout/${ad._id}`} className="btn-outline btn-sm inline-flex">
                        Complete Payment
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table layout from md up. */}
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">City</th>
                  <th className="px-4 py-2">Posted</th>
                  <th className="px-4 py-2">User Code</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ads.map((ad) => (
                  <tr key={ad._id}>
                    <td className="max-w-xs truncate px-4 py-2">{ad.title}</td>
                    <td className="px-4 py-2">{ad.category?.name || '—'}</td>
                    <td className="px-4 py-2">{ad.city || '—'}</td>
                    <td className="px-4 py-2 text-gray-500">{formatRelativeTime(ad.createdAt)}</td>
                    <td className="px-4 py-2">
                      <UserCode ad={ad} />
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={ad.status} />
                    </td>
                    <td className="px-4 py-2">
                      {needsCheckoutLink(ad) ? (
                        <Link to={`/checkout/${ad._id}`} className="btn-outline btn-sm">
                          Complete Payment
                        </Link>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
