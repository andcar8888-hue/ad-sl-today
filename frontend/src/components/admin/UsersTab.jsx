import { useEffect, useState } from 'react';
import { fetchAllUsersAdmin } from '../../api/auth';
import Alert from '../Alert';
import Spinner from '../Spinner';
import { getErrorMessage } from '../../utils/errors';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAllUsersAdmin()
      .then((data) => setUsers(data.users || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      {users.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-gray-500">
          No users found.
        </p>
      ) : (
        <>
          {/* Card layout below md — easier to scan/tap than a squeezed table. */}
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <div key={user._id} className="space-y-1 rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{user.name}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold capitalize text-primary-dark">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{user.email}</p>
                <p className="text-xs text-gray-500">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>

          {/* Table layout from md up. */}
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2 capitalize">{user.role}</td>
                    <td className="px-4 py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
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
