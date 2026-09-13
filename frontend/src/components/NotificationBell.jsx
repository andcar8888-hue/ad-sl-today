import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead,
} from '../api/notifications';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import Spinner from './Spinner';

const POLL_INTERVAL_MS = 30000;

/**
 * Navbar bell icon + unread badge + dropdown list, shown whenever the
 * viewer is authenticated. Polls the unread count every 30s so the badge
 * stays roughly current without the user having to refresh.
 *
 * The dropdown panel is `fixed` and pinned to the viewport edges below `sm`
 * (rather than `absolute right-0 w-80`) because this component is mounted
 * inside Navbar's mobile header row too, where a fixed 320px-wide panel
 * anchored to a small icon button can run off the left edge of a narrow
 * phone screen. From `sm` up it reverts to the original absolute/right-0/
 * w-80 behavior, which has plenty of room next to the desktop nav cluster.
 */
export default function NotificationBell() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const refreshUnreadCount = useCallback(() => {
    fetchUnreadNotificationCount()
      .then((data) => setUnreadCount(data.count || 0))
      .catch(() => {
        // Non-fatal — the badge just stays at its last known value.
      });
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setLoading(true);
        fetchNotifications()
          .then((data) => setNotifications(data.notifications || []))
          .catch(() => {
            // Non-fatal — the panel just shows an empty list.
          })
          .finally(() => setLoading(false));
      }
      return next;
    });
  };

  const handleNotificationClick = async (notification) => {
    setOpen(false);
    try {
      if (!notification.read) {
        await markNotificationRead(notification._id);
        refreshUnreadCount();
      }
    } catch {
      // Non-fatal — still navigate even if marking-as-read failed.
    }
    if (notification.relatedAdId) {
      navigate(`/ads/${notification.relatedAdId._id || notification.relatedAdId}`);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium hover:bg-white/10 hover:text-primary-light"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-4 top-16 z-30 max-h-96 overflow-y-auto rounded-md border border-border bg-white text-ink shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
          <div className="border-b border-border px-3 py-2.5 text-sm font-semibold text-ink">Notifications</div>
          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-5 w-5" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center text-gray-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8 text-gray-300" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-sm">No notifications yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notification) => (
                <li key={notification._id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full items-start gap-2.5 px-3 py-3 text-left text-sm transition hover:bg-surface-muted ${
                      notification.read ? 'text-gray-500' : 'bg-primary/5 font-medium text-ink'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        notification.read ? 'bg-transparent' : 'bg-primary'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block">{notification.message}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
