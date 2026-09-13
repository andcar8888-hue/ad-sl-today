import { useState } from 'react';
import AdsTab from '../components/admin/AdsTab';
import OrdersTab from '../components/admin/OrdersTab';
import CategoriesTab from '../components/admin/CategoriesTab';
import UsersTab from '../components/admin/UsersTab';
import AdLevelsTab from '../components/admin/AdLevelsTab';

const TABS = [
  { key: 'ads', label: 'Manage Ads', Component: AdsTab },
  { key: 'orders', label: 'Orders & Payments', Component: OrdersTab },
  { key: 'categories', label: 'Categories', Component: CategoriesTab },
  { key: 'users', label: 'Users', Component: UsersTab },
  { key: 'ad-levels', label: 'Ad Levels', Component: AdLevelsTab },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const ActiveComponent = TABS.find((tab) => tab.key === activeTab)?.Component;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ink">Super Admin Dashboard</h1>

      <div className="-mx-4 flex gap-2 overflow-x-auto border-b border-border px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
        {TABS.map((tab) => (
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
