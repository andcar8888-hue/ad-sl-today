import { useEffect, useState } from 'react';
import {
  createAdLevel,
  deleteAdLevel,
  fetchAllAdLevelsAdmin,
  updateAdLevel,
} from '../../api/adLevels';
import Alert from '../Alert';
import Spinner from '../Spinner';
import { getErrorMessage } from '../../utils/errors';

const EMPTY_NEW_LEVEL = { name: '', price: '', durationDays: '' };

function ClockIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3.5 2" />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

// Builds the per-row edit form state from a level, so text inputs always
// have a defined string value (avoids uncontrolled -> controlled warnings).
const editFormFromLevel = (level) => ({
  name: level.name || '',
  price: String(level.price ?? ''),
  durationDays: level.durationDays === null || level.durationDays === undefined ? '' : String(level.durationDays),
  priority: String(level.priority ?? 0),
  isActive: Boolean(level.isActive),
});

export default function AdLevelsTab() {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newLevel, setNewLevel] = useState(EMPTY_NEW_LEVEL);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Inline edit panel state — only one level can be edited at a time.
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [actionMessage, setActionMessage] = useState('');

  const loadLevels = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllAdLevelsAdmin();
      setLevels(data.levels || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLevels();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!newLevel.name.trim() || newLevel.price === '') return;
    setCreating(true);
    setCreateError('');
    try {
      await createAdLevel({
        name: newLevel.name.trim(),
        price: Number(newLevel.price),
        durationDays: newLevel.durationDays === '' ? null : Number(newLevel.durationDays),
      });
      setNewLevel(EMPTY_NEW_LEVEL);
      await loadLevels();
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (level) => {
    setEditingId(level._id);
    setEditError('');
    setEditForm(editFormFromLevel(level));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setEditError('');
  };

  const updateEditField = (name, value) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Only sends fields that actually changed, same diff-and-send pattern
  // AdsTab.jsx's edit panel uses.
  const handleSaveEdit = async (level) => {
    setEditSaving(true);
    setEditError('');
    try {
      const payload = {};
      if (editForm.name.trim() !== (level.name || '')) payload.name = editForm.name.trim();

      const newPrice = Number(editForm.price);
      if (newPrice !== level.price) payload.price = newPrice;

      const newDurationDays = editForm.durationDays === '' ? null : Number(editForm.durationDays);
      const currentDurationDays = level.durationDays === undefined ? null : level.durationDays;
      if (newDurationDays !== currentDurationDays) payload.durationDays = newDurationDays;

      const newPriority = Number(editForm.priority);
      if (newPriority !== (level.priority ?? 0)) payload.priority = newPriority;

      if (editForm.isActive !== Boolean(level.isActive)) payload.isActive = editForm.isActive;

      if (Object.keys(payload).length > 0) {
        await updateAdLevel(level._id, payload);
      }
      cancelEdit();
      await loadLevels();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (level) => {
    if (!window.confirm(`Delete ad level "${level.name}"?`)) return;
    setActionMessage('');
    setError('');
    try {
      const data = await deleteAdLevel(level._id);
      setActionMessage(data.message);
      await loadLevels();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {actionMessage && <Alert variant="info">{actionMessage}</Alert>}

      {/* Add new ad level */}
      <form onSubmit={handleCreate} className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <PlusIcon className="h-4 w-4 text-primary" />
          Add Ad Level
        </h2>
        {createError && <Alert variant="error">{createError}</Alert>}
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            value={newLevel.name}
            onChange={(event) => setNewLevel((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Name (e.g. Top Ad)"
            aria-label="New ad level name"
            className="input-field"
          />
          <input
            type="number"
            min="0"
            value={newLevel.price}
            onChange={(event) => setNewLevel((prev) => ({ ...prev, price: event.target.value }))}
            placeholder="Price (LKR)"
            aria-label="New ad level price"
            className="input-field"
          />
          <input
            type="number"
            min="1"
            value={newLevel.durationDays}
            onChange={(event) => setNewLevel((prev) => ({ ...prev, durationDays: event.target.value }))}
            placeholder="Duration days (optional)"
            aria-label="New ad level duration in days"
            className="input-field"
          />
        </div>
        <button type="submit" disabled={creating} className="btn-primary">
          {creating ? 'Adding...' : 'Add Ad Level'}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        // Divider + heading between the "add" form and the existing-levels
        // list, so the two sections read as distinct steps rather than one
        // continuous block.
        <div className="space-y-3 border-t border-border pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Existing Ad Levels</h2>
          <ul className="space-y-3">
          {levels.map((level) => (
            <li key={level._id} className="space-y-3 rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink">{level.name}</h3>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        level.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {level.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                    <span className="text-base font-extrabold leading-none text-primary">
                      LKR {level.price}
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {level.durationDays ? `${level.durationDays}-day boost` : 'No expiry'}
                    </span>
                    <span aria-hidden="true">&middot;</span>
                    <span>Priority {level.priority ?? 0}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => (editingId === level._id ? cancelEdit() : startEdit(level))}
                    className="btn-secondary btn-sm"
                  >
                    {editingId === level._id ? 'Close' : 'Edit'}
                  </button>
                  <button type="button" onClick={() => handleDelete(level)} className="btn-danger btn-sm">
                    Delete
                  </button>
                </div>
              </div>

              {editingId === level._id && editForm && (
                <div className="space-y-3 rounded-md border border-border bg-surface-muted/60 p-3">
                  {editError && <Alert variant="error">{editError}</Alert>}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="field-label" htmlFor={`level-name-${level._id}`}>
                        Name
                      </label>
                      <input
                        id={`level-name-${level._id}`}
                        value={editForm.name}
                        onChange={(event) => updateEditField('name', event.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`level-price-${level._id}`}>
                        Price (LKR)
                      </label>
                      <input
                        id={`level-price-${level._id}`}
                        type="number"
                        min="0"
                        value={editForm.price}
                        onChange={(event) => updateEditField('price', event.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`level-duration-${level._id}`}>
                        Duration Days (blank = no expiry)
                      </label>
                      <input
                        id={`level-duration-${level._id}`}
                        type="number"
                        min="1"
                        value={editForm.durationDays}
                        onChange={(event) => updateEditField('durationDays', event.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="field-label" htmlFor={`level-priority-${level._id}`}>
                        Priority (higher = boosted higher)
                      </label>
                      <input
                        id={`level-priority-${level._id}`}
                        type="number"
                        value={editForm.priority}
                        onChange={(event) => updateEditField('priority', event.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id={`level-active-${level._id}`}
                        type="checkbox"
                        checked={editForm.isActive}
                        onChange={(event) => updateEditField('isActive', event.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                      <label className="field-label mb-0" htmlFor={`level-active-${level._id}`}>
                        Active (visible to users when posting an ad)
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(level)}
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
              )}
            </li>
          ))}
          {levels.length === 0 && (
            <li className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-gray-500">
              No ad levels yet.
            </li>
          )}
          </ul>
        </div>
      )}
    </div>
  );
}
