import { useEffect, useState } from 'react';
import { createCategory, deleteCategory, fetchCategories } from '../../api/categories';
import { useAuth } from '../../context/AuthContext';
import Alert from '../Alert';
import Spinner from '../Spinner';
import { getErrorMessage } from '../../utils/errors';

/** Warning-triangle glyph — flags the reassign prompt as a "you need to
 * decide something" moment rather than a routine form section. Uses
 * --color-warning (amber), never --color-gold, so it reads distinctly from
 * the ad-tier "featured" color used elsewhere in the app. */
function WarningTriangleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 3.5h.01M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.3 2.25h17.76a1.5 1.5 0 0 0 1.3-2.25L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z" />
    </svg>
  );
}

export default function CategoriesTab() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Tracks which category (by id) is currently prompting the admin to pick a
  // replacement category, after a plain delete attempt came back with
  // `adsCount` (ads still reference it). `null` = no prompt showing.
  const [reassignPromptFor, setReassignPromptFor] = useState(null);
  const [reassignAdsCount, setReassignAdsCount] = useState(0);
  const [reassignTarget, setReassignTarget] = useState('');
  const [reassignSubmitting, setReassignSubmitting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCategories();
      setCategories(data.categories || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAdd = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await createCategory(name.trim());
      setName('');
      await loadCategories();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    setError('');
    try {
      await deleteCategory(id);
      setReassignPromptFor(null);
      await loadCategories();
    } catch (err) {
      const adsCount = err?.response?.data?.adsCount;
      if (adsCount) {
        // Ads still reference this category — prompt for a replacement
        // instead of surfacing a plain error.
        setReassignPromptFor(id);
        setReassignAdsCount(adsCount);
        setReassignTarget('');
      } else {
        setError(getErrorMessage(err));
      }
    }
  };

  const cancelReassignPrompt = () => {
    setReassignPromptFor(null);
    setReassignAdsCount(0);
    setReassignTarget('');
  };

  const handleReassignAndDelete = async (id) => {
    if (!reassignTarget) return;
    setReassignSubmitting(true);
    setError('');
    try {
      await deleteCategory(id, reassignTarget);
      cancelReassignPrompt();
      await loadCategories();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReassignSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New category name"
          aria-label="New category name"
          className="input-field sm:flex-1"
        />
        <button type="submit" disabled={submitting} className="btn-primary">
          Add Category
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {categories.map((category) => (
            <li key={category._id} className="px-4 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-ink">{category.name}</span>
                {/* Hidden (not disabled) for admin_assistant — only a true
                    admin may delete anywhere, per the role hierarchy. */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(category._id)}
                    aria-label={`Delete category ${category.name}`}
                    className="btn-outline btn-sm"
                  >
                    Delete
                  </button>
                )}
              </div>

              {/* Inline reassign-required prompt — shown only for the
                  category the admin just tried (and failed) to delete
                  because ads still reference it. */}
              {reassignPromptFor === category._id && (
                <div className="mt-2 space-y-2.5 rounded-md border border-warning/50 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <WarningTriangleIcon className="h-5 w-5 shrink-0 text-warning" />
                    <p className="text-xs text-amber-900">
                      This category has <span className="font-semibold">{reassignAdsCount}</span> ad(s).
                      Choose a replacement category to move them into before deleting.
                    </p>
                  </div>
                  <select
                    value={reassignTarget}
                    onChange={(event) => setReassignTarget(event.target.value)}
                    aria-label="Replacement category"
                    className="input-field"
                  >
                    <option value="">Select a replacement category</option>
                    {categories
                      .filter((c) => c._id !== category._id)
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleReassignAndDelete(category._id)}
                      disabled={!reassignTarget || reassignSubmitting}
                      className="btn-primary btn-sm"
                    >
                      {reassignSubmitting ? 'Moving...' : 'Move & Delete'}
                    </button>
                    <button type="button" onClick={cancelReassignPrompt} className="btn-secondary btn-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {categories.length === 0 && (
            <li className="px-4 py-6 text-center text-gray-500">No categories yet.</li>
          )}
        </ul>
      )}
    </div>
  );
}
