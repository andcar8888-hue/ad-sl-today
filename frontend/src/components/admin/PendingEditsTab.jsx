import { useCallback, useEffect, useState } from 'react';
import { approveEditRequest, fetchPendingEditsAdmin, rejectEditRequest } from '../../api/ads';
import { resolveImageUrl } from '../../utils/images';
import Alert from '../Alert';
import Spinner from '../Spinner';
import { getErrorMessage } from '../../utils/errors';

// One old-vs-new field row inside the comparison table below. Renders
// nothing (returns null) when both values are effectively identical, so the
// panel only highlights what actually changed.
// Below `sm` (the same single-column-diff treatment this whole tab uses at
// narrow widths) each mini label re-states "Current"/"Requested" per value
// since the 3-column header row is hidden there — see the header row below.
const MINI_LABEL_CLASSES = 'mb-0.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-400 sm:hidden';

function CompareRow({ label, oldValue, newValue }) {
  const oldDisplay = oldValue || '—';
  const newDisplay = newValue || '—';
  if (oldDisplay === newDisplay) return null;

  return (
    <div className="grid grid-cols-1 gap-1.5 py-3 text-sm sm:grid-cols-3 sm:items-start sm:gap-2 sm:py-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 sm:text-sm sm:font-normal sm:normal-case sm:tracking-normal">
        {label}
      </dt>
      {/* Narrow screens: old value struck through directly above the new
          value, stacked in one column (grid-cols-1) — reads far better than
          cramming 3 columns into ~340px than the sm+ side-by-side layout. */}
      <dd className="whitespace-pre-wrap text-ink">
        <span className={MINI_LABEL_CLASSES}>Current</span>
        <span className="line-through decoration-primary/40">{oldDisplay}</span>
      </dd>
      <dd className="whitespace-pre-wrap font-medium text-ink">
        <span className={MINI_LABEL_CLASSES}>Requested</span>
        {newDisplay}
      </dd>
    </div>
  );
}

function ImageCompareRow({ oldImages, newImages }) {
  const oldList = oldImages || [];
  const newList = newImages || [];
  if (JSON.stringify(oldList) === JSON.stringify(newList)) return null;

  return (
    <div className="grid grid-cols-1 gap-1.5 py-3 text-sm sm:grid-cols-3 sm:items-start sm:gap-2 sm:py-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 sm:text-sm sm:font-normal sm:normal-case sm:tracking-normal">
        Images
      </dt>
      <dd className="flex flex-wrap items-center gap-1.5">
        <span className={`${MINI_LABEL_CLASSES} w-full`}>Current</span>
        {oldList.length === 0 && <span className="text-gray-500">—</span>}
        {oldList.map((img) => (
          <img key={img} src={resolveImageUrl(img)} alt="" className="h-12 w-12 rounded object-cover opacity-60" />
        ))}
      </dd>
      <dd className="flex flex-wrap items-center gap-1.5">
        <span className={`${MINI_LABEL_CLASSES} w-full`}>Requested</span>
        {newList.length === 0 && <span className="text-gray-500">—</span>}
        {newList.map((img) => (
          <img key={img} src={resolveImageUrl(img)} alt="" className="h-12 w-12 rounded object-cover" />
        ))}
      </dd>
    </div>
  );
}

export default function PendingEditsTab() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  const loadAds = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPendingEditsAdmin();
      setAds(data.ads || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const handleApprove = async (id) => {
    setActioningId(id);
    setError('');
    try {
      await approveEditRequest(id);
      await loadAds();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id) => {
    // Reason is optional here (unlike rejecting a whole ad) — an empty
    // prompt result (cancel) still lets a blank reason through on purpose.
    const reason = window.prompt('Reason for rejecting this edit (optional):');
    if (reason === null) return; // user hit Cancel
    setActioningId(id);
    setError('');
    try {
      await rejectEditRequest(id, reason.trim() || undefined);
      await loadAds();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : ads.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-gray-500">
          No pending edits.
        </p>
      ) : (
        <div className="space-y-4">
          {ads.map((ad) => {
            const pending = ad.pendingChanges || {};
            return (
              <div key={ad._id} className="space-y-3 rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">{ad.title}</h3>
                    <p className="text-xs text-gray-500">
                      {ad.user?.name} <span className="text-gray-500">({ad.user?.email})</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(ad._id)}
                      disabled={actioningId === ad._id}
                      className="btn-success btn-sm"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(ad._id)}
                      disabled={actioningId === ad._id}
                      className="btn-danger btn-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div className="rounded-md border border-border bg-surface-muted/40 p-3">
                  <div className="hidden gap-2 pb-2 text-xs font-semibold uppercase text-gray-500 sm:grid sm:grid-cols-3">
                    <span>Field</span>
                    <span>Current (live)</span>
                    <span>Requested change</span>
                  </div>
                  <dl className="divide-y divide-border">
                    <CompareRow label="Title" oldValue={ad.title} newValue={pending.title} />
                    <CompareRow label="Description" oldValue={ad.description} newValue={pending.description} />
                    <CompareRow label="Category" oldValue={ad.category?.name} newValue={pending.category?.name} />
                    <CompareRow label="City" oldValue={ad.city} newValue={pending.city} />
                    <CompareRow label="WhatsApp" oldValue={ad.whatsappNumber} newValue={pending.whatsappNumber} />
                    <CompareRow
                      label="Telegram"
                      oldValue={ad.telegramUsername}
                      newValue={pending.telegramUsername}
                    />
                    <ImageCompareRow oldImages={ad.images} newImages={pending.images} />
                  </dl>
                </div>

                {pending.submittedAt && (
                  <p className="text-xs text-gray-500">
                    Submitted {new Date(pending.submittedAt).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
