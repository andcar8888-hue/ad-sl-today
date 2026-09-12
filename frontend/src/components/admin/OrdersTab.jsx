import { useEffect, useState } from 'react';
import { confirmOrderPayment, fetchAllOrdersAdmin } from '../../api/checkout';
import Alert from '../Alert';
import Spinner from '../Spinner';
import StatusBadge from '../StatusBadge';
import { getErrorMessage } from '../../utils/errors';

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actioningId, setActioningId] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAllOrdersAdmin();
      setOrders(data.orders || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleConfirm = async (id) => {
    setActioningId(id);
    setError('');
    try {
      await confirmOrderPayment(id);
      await loadOrders();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  const confirmButton = (order, { size } = {}) =>
    order.status !== 'confirmed' && (
      <button
        type="button"
        onClick={() => handleConfirm(order._id)}
        disabled={actioningId === order._id}
        className={`btn-success ${size === 'sm' ? 'btn-sm' : ''}`}
      >
        Confirm Payment
      </button>
    );

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      {orders.length === 0 ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-6 text-center text-gray-500">
          No orders found.
        </p>
      ) : (
        <>
          {/* Card layout below md — easier to scan/tap than a squeezed table. */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <div key={order._id} className="space-y-2 rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-sm font-semibold text-ink">{order.userCode}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-xs text-gray-500">{order.ad?.title || '—'}</p>
                <p className="text-xs text-gray-500">
                  {order.user?.name} <span className="text-gray-500">({order.user?.email})</span>
                </p>
                {confirmButton(order)}
              </div>
            ))}
          </div>

          {/* Table layout from md up. */}
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface md:block">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-muted text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">User Code</th>
                  <th className="px-4 py-2">Ad</th>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-4 py-2 font-mono">{order.userCode}</td>
                    <td className="max-w-xs truncate px-4 py-2">{order.ad?.title || '—'}</td>
                    <td className="px-4 py-2">
                      {order.user?.name} <span className="text-gray-500">({order.user?.email})</span>
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-2">{confirmButton(order, { size: 'sm' })}</td>
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
