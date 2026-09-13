import { useCallback, useEffect, useState } from 'react';
import {
  createUserAdmin,
  deleteUserAdmin,
  fetchAllUsersAdmin,
  toggleUserBlock,
  updateUserAdmin,
} from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import Alert from '../Alert';
import Spinner from '../Spinner';
import { getErrorMessage } from '../../utils/errors';

const PAGE_LIMIT = 20;

// Every role the backend accepts. Only a true `admin` viewer may ever pick
// from this list — see the role `<select>` gating below. `admin_assistant`
// creating/editing a user must never send a `role` field at all (the
// backend 403s on the field's mere presence), so for that viewer tier the
// role select is omitted entirely rather than disabled-with-a-value.
const ALL_ROLES = ['user', 'moderator', 'admin_assistant', 'admin'];

const EMPTY_NEW_USER = { name: '', email: '', password: '', role: 'user' };

function formatRoleLabel(role) {
  if (!role) return '';
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function UsersTab() {
  const { isAdmin, user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);

  // "Add User" form.
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_NEW_USER);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

  // Inline edit panel — only one user can be edited at a time.
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Per-row block/unblock in-flight indicator.
  const [blockingId, setBlockingId] = useState(null);

  const [actionMessage, setActionMessage] = useState('');

  const loadUsers = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError('');
      try {
        const params = { page: pageToLoad, limit: PAGE_LIMIT };
        if (debouncedSearch) params.search = debouncedSearch;
        const data = await fetchAllUsersAdmin(params);
        setUsers(data.users || []);
        setPagination(data.pagination || null);
        setPage(pageToLoad);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch]
  );

  // Re-load from page 1 whenever the (debounced) search text changes.
  useEffect(() => {
    loadUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const isSelf = (id) => id === currentUser?.id;

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditError('');
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setEditError('');
  };

  const updateEditField = (name, value) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Only sends fields that actually changed. `role` is only ever included
  // if this viewer isAdmin AND it actually changed — an admin_assistant
  // never renders/edits the role select at all, so its value here always
  // stays untouched (see the read-only fallback in the edit panel below).
  const handleSaveEdit = async (user) => {
    setEditSaving(true);
    setEditError('');
    try {
      const payload = {};
      if (editForm.name.trim() !== (user.name || '')) payload.name = editForm.name.trim();
      if (editForm.email.trim() !== (user.email || '')) payload.email = editForm.email.trim();
      if (editForm.phone.trim() !== (user.phone || '')) payload.phone = editForm.phone.trim();
      if (isAdmin && editForm.role !== user.role) payload.role = editForm.role;

      if (Object.keys(payload).length > 0) {
        await updateUserAdmin(user._id, payload);
      }
      cancelEdit();
      await loadUsers(page);
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleBlock = async (user) => {
    setBlockingId(user._id);
    setError('');
    try {
      await toggleUserBlock(user._id, !user.blocked);
      await loadUsers(page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBlockingId(null);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    setError('');
    try {
      await deleteUserAdmin(user._id);
      setActionMessage('User deleted');
      await loadUsers(page);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleAddUser = async (event) => {
    event.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password) return;
    setAddSubmitting(true);
    setAddError('');
    try {
      const payload = {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
      };
      // Only an admin viewer ever sends `role` — an admin_assistant sending
      // ANY role field (even the default `'user'`) gets a 403, so this
      // field is omitted entirely for that tier, matching the backend
      // default.
      if (isAdmin) payload.role = newUser.role;

      await createUserAdmin(payload);
      setNewUser(EMPTY_NEW_USER);
      setShowAddForm(false);
      await loadUsers(1);
    } catch (err) {
      setAddError(getErrorMessage(err));
    } finally {
      setAddSubmitting(false);
    }
  };

  const hasPrev = page > 1;
  const hasNext = pagination && page < pagination.pages;

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {actionMessage && <Alert variant="info">{actionMessage}</Alert>}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name or email..."
          aria-label="Search users"
          className="input-field sm:max-w-xs"
        />
        <button
          type="button"
          onClick={() => setShowAddForm((open) => !open)}
          className="btn-primary shrink-0"
        >
          {showAddForm ? 'Close' : 'Add User'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddUser} className="space-y-3 rounded-lg border border-border bg-surface p-4">
          {addError && <Alert variant="error">{addError}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="new-user-name">
                Name
              </label>
              <input
                id="new-user-name"
                value={newUser.name}
                onChange={(event) => setNewUser((prev) => ({ ...prev, name: event.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="new-user-email">
                Email
              </label>
              <input
                id="new-user-email"
                type="email"
                value={newUser.email}
                onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
                className="input-field"
              />
            </div>
            {/* Spans both columns only when the Role field below is absent
                (non-admin viewer) — otherwise 3 fields in a 2-col grid leave
                Password stranded alone in row 2 with a dangling empty cell
                beside it. */}
            <div className={isAdmin ? '' : 'sm:col-span-2'}>
              <label className="field-label" htmlFor="new-user-password">
                Password
              </label>
              <input
                id="new-user-password"
                type="password"
                value={newUser.password}
                onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))}
                className="input-field"
              />
            </div>
            {/* The role select is only ever rendered for a true admin —
                sending a `role` field at all as an admin_assistant 403s
                server-side, so that viewer tier never gets the option and
                new users they create are always `'user'` by omission. */}
            {isAdmin && (
              <div>
                <label className="field-label" htmlFor="new-user-role">
                  Role
                </label>
                <select
                  id="new-user-role"
                  value={newUser.role}
                  onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
                  className="input-field"
                >
                  {ALL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {formatRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button type="submit" disabled={addSubmitting} className="btn-primary">
            {addSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : users.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-gray-500">
          No users found.
        </p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const self = isSelf(user._id);
            return (
              <div key={user._id} className="space-y-3 rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{user.name}</span>
                      {self && (
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          You
                        </span>
                      )}
                      {/* Neutral, outlined chip — deliberately NOT the same
                          bg-primary/10 treatment as the Blocked/Active pill
                          beside it (which is semantically red/green), so the
                          two never read as competing "both reddish" pills.
                          A single flat style for every role (differentiated
                          only by label text) also keeps this "who has what
                          access" list low-noise rather than tiering roles
                          with color, which --color-gold/--color-warning are
                          both reserved against anyway (see index.css). */}
                      <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink">
                        {formatRoleLabel(user.role)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                          user.blocked ? 'bg-red-100 text-primary-dark' : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.blocked ? 'Blocked' : 'Active'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                    <p className="text-xs text-gray-500">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => (editingId === user._id ? cancelEdit() : startEdit(user))}
                      className="btn-secondary btn-sm"
                    >
                      {editingId === user._id ? 'Close' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleBlock(user)}
                      disabled={self || blockingId === user._id}
                      title={self ? 'You cannot change your own account this way' : undefined}
                      className={user.blocked ? 'btn-success btn-sm' : 'btn-danger btn-sm'}
                    >
                      {blockingId === user._id ? 'Saving...' : user.blocked ? 'Unblock' : 'Block'}
                    </button>
                    {/* Hidden (not just disabled) for a non-admin viewer,
                        and for the viewer's own row — rendering a button
                        that will just 403 is worse UX than not showing it. */}
                    {isAdmin && !self && (
                      <button type="button" onClick={() => handleDelete(user)} className="btn-danger btn-sm">
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {editingId === user._id && editForm && (
                  <div className="space-y-3 rounded-md border border-border bg-surface-muted/60 p-3">
                    {editError && <Alert variant="error">{editError}</Alert>}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="field-label" htmlFor={`edit-user-name-${user._id}`}>
                          Name
                        </label>
                        <input
                          id={`edit-user-name-${user._id}`}
                          value={editForm.name}
                          onChange={(event) => updateEditField('name', event.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`edit-user-email-${user._id}`}>
                          Email
                        </label>
                        <input
                          id={`edit-user-email-${user._id}`}
                          type="email"
                          value={editForm.email}
                          onChange={(event) => updateEditField('email', event.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`edit-user-phone-${user._id}`}>
                          Phone
                        </label>
                        <input
                          id={`edit-user-phone-${user._id}`}
                          value={editForm.phone}
                          onChange={(event) => updateEditField('phone', event.target.value)}
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="field-label" htmlFor={`edit-user-role-${user._id}`}>
                          Role
                        </label>
                        {/* Only a true admin may change role, and never on
                            their OWN row — everyone else (including the
                            admin_assistant tier that can otherwise reach
                            this panel) sees plain read-only text instead of
                            an interactive select, since sending a `role`
                            field at all 403s for them server-side. */}
                        {isAdmin && !self ? (
                          <select
                            id={`edit-user-role-${user._id}`}
                            value={editForm.role}
                            onChange={(event) => updateEditField('role', event.target.value)}
                            className="input-field"
                          >
                            {ALL_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {formatRoleLabel(role)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p
                            className="input-field flex cursor-not-allowed items-center bg-surface-muted text-gray-400"
                            title={
                              self
                                ? 'You cannot change your own role'
                                : 'Only an admin can change a user’s role'
                            }
                          >
                            {formatRoleLabel(user.role)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(user)}
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
              </div>
            );
          })}
        </div>
      )}

      {pagination && (hasPrev || hasNext) && (
        <div className="flex items-center justify-center gap-3 pt-2 text-sm text-gray-500">
          <button
            type="button"
            onClick={() => loadUsers(page - 1)}
            disabled={!hasPrev}
            className="btn-outline btn-sm"
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages || 1}
          </span>
          <button
            type="button"
            onClick={() => loadUsers(page + 1)}
            disabled={!hasNext}
            className="btn-outline btn-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
