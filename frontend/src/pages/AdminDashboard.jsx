import { useMemo, useState } from 'react';
import AdsTab from '../components/admin/AdsTab';
import OrdersTab from '../components/admin/OrdersTab';
import CategoriesTab from '../components/admin/CategoriesTab';
import UsersTab from '../components/admin/UsersTab';
import AdLevelsTab from '../components/admin/AdLevelsTab';
import PendingEditsTab from '../components/admin/PendingEditsTab';
import { useAuth } from '../context/AuthContext';

// `minLevel: 'moderator'` = visible to moderator-tier and above (the whole
// admin panel). `minLevel: 'manager'` = visible to admin_assistant-tier and
// above only (user/category/ad-level/order management — everything a
// moderator cannot touch per the backend role hierarchy).
const TABS = [
  { key: 'ads', label: 'Manage Ads', Component: AdsTab, minLevel: 'moderator' },
  { key: 'pending-edits', label: 'Pending Edits', Component: PendingEditsTab, minLevel: 'moderator' },
  { key: 'orders', label: 'Orders & Payments', Component: OrdersTab, minLevel: 'manager' },
  { key: 'categories', label: 'Categories', Component: CategoriesTab, minLevel: 'manager' },
  { key: 'users', label: 'Users', Component: UsersTab, minLevel: 'manager' },
  { key: 'ad-levels', label: 'Ad Levels', Component: AdLevelsTab, minLevel: 'manager' },
];

// "admin_assistant" -> "Admin Assistant", etc. — same helper as Navbar.jsx,
// kept local since it's only display text, never a permission decision.
function formatRoleLabel(role) {
  if (!role) return '';
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function AdminDashboard() {
  const { isModerator, isManager, role } = useAuth();

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => (tab.minLevel === 'manager' ? isManager : isModerator)),
    [isManager, isModerator]
  );

  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.key);
  const ActiveComponent = visibleTabs.find((tab) => tab.key === activeTab)?.Component;

  return (
    <div className="space-y-6">
      {/* flex-wrap (not a fixed inline suffix) so the pill drops to its own
          line on narrow viewports instead of clipping/overflowing next to
          the title — "Admin Assistant View" is the longest case. */}
      <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-ink">
        Super Admin Dashboard
        {role && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary-dark">
            {formatRoleLabel(role)} View
          </span>
        )}
      </h1>

      <div className="-mx-4 flex gap-2 overflow-x-auto border-b border-border px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
            className={`min-h-11 shrink-0 rounded-t-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'bg-surface-muted text-ink hover:bg-border/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {ActiveComponent && <ActiveComponent />}
    </div>
  );
}
