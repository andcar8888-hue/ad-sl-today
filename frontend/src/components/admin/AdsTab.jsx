import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  approveAd,
  fetchAllAdsAdmin,
  rejectAd,
  removeAdImage,
  updateAdAdmin,
} from '../../api/ads';
import { fetchAllAdLevelsAdmin } from '../../api/adLevels';
import { useAuth } from '../../context/AuthContext';
import { useCategories } from '../../hooks/useCategories';
import { resolveImageUrl } from '../../utils/images';
import Alert from '../Alert';
import Spinner from '../Spinner';
import StatusBadge from '../StatusBadge';
import { getErrorMessage } from '../../utils/errors';

const STATUS_OPTIONS = ['', 'draft', 'pending_payment', 'approved', 'rejected', 'expired'];

const EMPTY_EDIT_FORM = {
  title: '',
  description: '',
  city: '',
  whatsappNumber: '',
  telegramUsername: '',
  category: '',
  adLevel: '',
  isFake: false,
};

export default function AdsTab() {
  const { user } = useAuth();
  // A moderator (the lowest tier reaching this tab) cannot change an ad's
  // pricing level — that's a monetization decision, not "content" — the
  // backend 403s if `adLevel` is present at all in a moderator's PATCH
  // body, so the select is hidden entirely for that tier rather than just
  // disabled. admin_assistant/admin see it normally.
  const isModeratorRole = user?.role === 'moderator';
  const { categories } = useCategories();
  // Uses the ADMIN listing (active + inactive) so an ad currently assigned
  // to a since-deactivated level still shows correctly in the select.
  const [adLevels, setAdLevels] = useState([]);
  const [ads, setAds] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    fetchAllAdLevelsAdmin()
      .then((data) => setAdLevels(data.levels || []))
      .catch(() => {
        // Non-fatal — the select just renders empty if this fails.
      });
  }, []);

  // Inline edit panel state — only one ad can be edited at a time.
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const loadAds = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllAdsAdmin(status || undefined);
      setAds(data.ads || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const handleApprove = async (id) => {
    setActioningId(id);
    setError('');
    try {
      await approveAd(id);
      await loadAds();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejecting this ad:');
    if (!reason || !reason.trim()) return;
    setActioningId(id);
    setError('');
    try {
      await rejectAd(id, reason.trim());
      await loadAds();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  const startEdit = (ad) => {
    setEditingId(ad._id);
    setEditError('');
    setEditForm({
      title: ad.title || '',
      description: ad.description || '',
      city: ad.city || '',
      whatsappNumber: ad.whatsappNumber || '',
      telegramUsername: ad.telegramUsername || '',
      category: ad.category?._id || '',
      adLevel: ad.adLevel?._id || '',
      isFake: Boolean(ad.isFake),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(EMPTY_EDIT_FORM);
    setEditError('');
  };

  const updateEditField = (name, value) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Only sends fields that actually changed — the backend leaves anything
  // else (including `status`) untouched either way, but this keeps the
  // request payload minimal and makes intent clear.
  const handleSaveEdit = async (ad) => {
    setEditSaving(true);
    setEditError('');
    try {
      const payload = {};
      if (editForm.title.trim() !== (ad.title || '')) payload.title = editForm.title.trim();
      if (editForm.description.trim() !== (ad.description || '')) {
        payload.description = editForm.description.trim();
      }
      if (editForm.city.trim() !== (ad.city || '')) payload.city = editForm.city.trim();
      if (editForm.whatsappNumber.trim() !== (ad.whatsappNumber || '')) {
        payload.whatsappNumber = editForm.whatsappNumber.trim();
      }
      if (editForm.telegramUsername.trim() !== (ad.telegramUsername || '')) {
        payload.telegramUsername = editForm.telegramUsername.trim();
      }
      if (editForm.category !== (ad.category?._id || '')) payload.category = editForm.category;
      if (editForm.adLevel !== (ad.adLevel?._id || '')) payload.adLevel = editForm.adLevel;
      if (editForm.isFake !== Boolean(ad.isFake)) payload.isFake = editForm.isFake;

      if (Object.keys(payload).length > 0) {
        await updateAdAdmin(ad._id, payload);
      }
      cancelEdit();
      await loadAds();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setEditSaving(false);
    }
  };

  const handleRemoveImage = async (ad, image) => {
    if (!window.confirm('Remove this image from the ad?')) return;
    setEditError('');
    try {
      await removeAdImage(ad._id, image);
      await loadAds();
    } catch (err) {
      setEditError(getErrorMessage(err));
    }
  };

  const renderActions = (ad, { size } = {}) => (
    <div className="flex flex-wrap gap-2">
      {ad.status !== 'approved' && (
        <button
          type="button"
          onClick={() => handleApprove(ad._id)}
          disabled={actioningId === ad._id}
          className={`btn-success ${size === 'sm' ? 'btn-sm' : ''}`}
        >
          Approve
        </button>
      )}
      {ad.status !== 'rejected' && (
        <button
          type="button"
          onClick={() => handleReject(ad._id)}
          disabled={actioningId === ad._id}
          className={`btn-danger ${size === 'sm' ? 'btn-sm' : ''}`}
        >
          Reject
        </button>
      )}
      <button
        type="button"
        onClick={() => (editingId === ad._id ? cancelEdit() : startEdit(ad))}
        className={`btn-secondary ${size === 'sm' ? 'btn-sm' : ''}`}
      >
        {editingId === ad._id ? 'Close' : 'Edit'}
      </button>
    </div>
  );

  // Shared inline edit panel — pre-filled text fields plus a removable image
  // gallery. Rendered under the mobile card and inside an extra table row on
  // desktop. `ad` is always the freshest copy from `ads` state (re-fetched
  // after every save/remove), so the status badge and images stay in sync.
  const renderEditPanel = (ad) => (
    <div className="space-y-3 rounded-lg border border-border bg-surface-muted/60 p-3">
      {editError && <Alert variant="error">{editError}</Alert>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor={`edit-title-${ad._id}`}>
            Title
          </label>
          <input
            id={`edit-title-${ad._id}`}
            value={editForm.title}
            onChange={(event) => updateEditField('title', event.target.value)}
            className="input-field"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor={`edit-description-${ad._id}`}>
            Description
          </label>
          <textarea
            id={`edit-description-${ad._id}`}
            value={editForm.description}
            onChange={(event) => updateEditField('description', event.target.value)}
            rows={3}
            className="input-field"
          />
        </div>
        <div>
          <label className="field-label" htmlFor={`edit-category-${ad._id}`}>
            Category
          </label>
          <select
            id={`edit-category-${ad._id}`}
            value={editForm.category}
            onChange={(event) => updateEditField('category', event.target.value)}
            className="input-field"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        {/* Hidden entirely (not just disabled) for a moderator — the
            backend 403s the whole PATCH if `adLevel` is present at all in a
            moderator's request body, since pricing-tier changes are
            reserved for admin_assistant+. */}
        {!isModeratorRole && (
          <div>
            <label className="field-label" htmlFor={`edit-adlevel-${ad._id}`}>
              Ad Level
            </label>
            <select
              id={`edit-adlevel-${ad._id}`}
              value={editForm.adLevel}
              onChange={(event) => updateEditField('adLevel', event.target.value)}
              className="input-field"
            >
              <option value="">Select an ad level</option>
              {adLevels.map((level) => (
                <option key={level._id} value={level._id}>
                  {level.name} — LKR {level.price}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2 pt-6">
          <input
            id={`edit-isfake-${ad._id}`}
            type="checkbox"
            checked={editForm.isFake}
            onChange={(event) => updateEditField('isFake', event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <label className="field-label mb-0" htmlFor={`edit-isfake-${ad._id}`}>
            Mark as Fake Ad
          </label>
        </div>
        <div>
          <label className="field-label" htmlFor={`edit-city-${ad._id}`}>
            City
          </label>
          <input
            id={`edit-city-${ad._id}`}
            value={editForm.city}
            onChange={(event) => updateEditField('city', event.target.value)}
            className="input-field"
          />
        </div>
        <div>
          <label className="field-label" htmlFor={`edit-whatsapp-${ad._id}`}>
            WhatsApp Number
          </label>
          <input
            id={`edit-whatsapp-${ad._id}`}
            value={editForm.whatsappNumber}
            onChange={(event) => updateEditField('whatsappNumber', event.target.value)}
            className="input-field"
          />
        </div>
        {/* Spans both columns for a moderator viewer only — with the Ad
            Level field above hidden for that tier, the remaining fields
            total an odd number and this last one would otherwise trail
            alone in its row with an empty cell beside it. */}
        <div className={isModeratorRole ? 'sm:col-span-2' : ''}>
          <label className="field-label" htmlFor={`edit-telegram-${ad._id}`}>
            Telegram Username
          </label>
          <input
            id={`edit-telegram-${ad._id}`}
            value={editForm.telegramUsername}
            onChange={(event) => updateEditField('telegramUsername', event.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {ad.images?.length > 0 && (
        <div>
          <p className="field-label">Images</p>
          <div className="flex flex-wrap gap-2">
            {ad.images.map((image) => (
              <div key={image} className="relative h-16 w-16 overflow-hidden rounded-md border border-border">
                <img src={resolveImageUrl(image)} alt="" className="h-full w-full object-cover" />
                {/* Sized/positioned to match the remove button used in
                    StepImages.jsx (post-ad photo picker) — same interaction,
                    same touch target, kept consistent across the app. */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(ad, image)}
                  aria-label="Remove image"
                  className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm font-bold text-white shadow hover:bg-primary"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleSaveEdit(ad)}
          disabled={editSaving}
          className="btn-primary btn-sm"
        >
          {editSaving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" onClick={cancelEdit} className="btn-secondary btn-sm">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-medium text-ink">
          Filter by status:
        </label>
        <select
          id="status-filter"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="input-field w-auto py-2"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option || 'all'} value={option}>
              {option ? option.replace('_', ' ') : 'All'}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : ads.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-gray-500">
          No ads found.
        </p>
      ) : (
        <>
          {/* Card layout below md — easier to scan/tap than a squeezed table. */}
          <div className="space-y-3 md:hidden">
            {ads.map((ad) => (
              <div key={ad._id} className="space-y-2 rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">{ad.title}</h3>
                  <StatusBadge status={ad.status} />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                  <span>{ad.category?.name || 'Uncategorized'}</span>
                  <span aria-hidden="true">&middot;</span>
                  <span className="font-mono font-semibold text-ink">{ad.userCode || '—'}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {ad.user?.name} <span className="text-gray-500">({ad.user?.email})</span>
                </p>
                {renderActions(ad)}
                {editingId === ad._id && renderEditPanel(ad)}
              </div>
            ))}
          </div>

          {/* Table layout from md up. */}
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">User Code</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Owner</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ads.map((ad) => (
                  <Fragment key={ad._id}>
                    <tr>
                      <td className="max-w-xs truncate px-4 py-2">{ad.title}</td>
                      <td className="px-4 py-2 font-mono text-xs font-semibold text-ink">
                        {ad.userCode || '—'}
                      </td>
                      <td className="px-4 py-2">{ad.category?.name || '—'}</td>
                      <td className="max-w-[16rem] truncate px-4 py-2">
                        {ad.user?.name} <span className="text-gray-500">({ad.user?.email})</span>
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={ad.status} />
                      </td>
                      <td className="px-4 py-2">{renderActions(ad, { size: 'sm' })}</td>
                    </tr>
                    {editingId === ad._id && (
                      <tr>
                        <td colSpan={6} className="bg-surface-muted/40 px-4 py-3">
                          {renderEditPanel(ad)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
