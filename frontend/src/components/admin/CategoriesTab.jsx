import { useEffect, useState } from 'react';
import { createCategory, deleteCategory, fetchCategories } from '../../api/categories';
import Alert from '../Alert';
import Spinner from '../Spinner';
import { getErrorMessage } from '../../utils/errors';

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      await loadCategories();
    } catch (err) {
      setError(getErrorMessage(err));
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
            <li key={category._id} className="flex items-center justify-between gap-2 px-4 py-2.5">
              <span className="text-sm text-ink">{category.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(category._id)}
                aria-label={`Delete category ${category.name}`}
                className="btn-outline btn-sm"
              >
                Delete
              </button>
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
