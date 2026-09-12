const STATUS_STYLES = {
  draft: 'bg-gray-200 text-gray-700',
  pending_payment: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-primary-dark',
  confirmed: 'bg-green-100 text-green-800',
  // Slightly darker than "draft" for AA contrast + so the two are visually distinct.
  expired: 'bg-gray-300 text-gray-800',
};

const STATUS_LABELS = {
  draft: 'Draft',
  pending_payment: 'Pending Payment',
  approved: 'Approved',
  rejected: 'Rejected',
  confirmed: 'Confirmed',
  expired: 'Expired',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
