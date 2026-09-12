import { useEffect } from 'react';

// Reuses Alert's variant colors so toasts and inline banners read as the
// same visual language, just in a different (transient, fixed-position) shell.
const VARIANT_STYLES = {
  error: 'border-primary/30 bg-red-50 text-primary-dark',
  success: 'border-green-300 bg-green-50 text-green-800',
  info: 'border-border bg-surface-muted text-ink',
};

const ICONS = {
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 8v5" />
      <path strokeLinecap="round" d="M12 16h.01" />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.5l2.5 2.5 5-5.5" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 16v-5" />
      <path strokeLinecap="round" d="M12 8h.01" />
    </svg>
  ),
};

/**
 * Small transient, auto-dismissing notification for things that shouldn't
 * block the UI (e.g. "that photo was too large"). Fixed to the bottom of the
 * viewport — centered on mobile, bottom-right from `sm` up — so it never
 * covers the primary content.
 *
 * Renders nothing when `message` is falsy. Callers that need the auto-dismiss
 * timer to restart even when the *same* message is shown twice in a row
 * should remount it with a changing `key` prop (e.g. `<Toast key={toastId} .../>`).
 *
 * Props:
 *  - message {string} - required, the text to show. Falsy => renders null.
 *  - variant {'error'|'success'|'info'} - default 'error'.
 *  - duration {number} - ms before auto-dismiss, default 4000.
 *  - onClose {() => void} - called both on auto-dismiss and the close button.
 *  - bottomClassName {string} - override the `bottom-*` offset, e.g. when a
 *    page also has its own fixed/sticky bottom bar the toast would otherwise
 *    sit on top of. Default 'bottom-4'.
 */
export default function Toast({
  message,
  variant = 'error',
  duration = 4000,
  onClose,
  bottomClassName = 'bottom-4',
}) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-4 z-50 flex justify-center sm:inset-x-auto sm:right-4 sm:justify-end ${bottomClassName}`}
    >
      <div
        className={`flex w-full max-w-sm items-start gap-2.5 rounded-md border px-4 py-3 text-sm shadow-lg ${
          VARIANT_STYLES[variant] || VARIANT_STYLES.error
        }`}
      >
        <span aria-hidden="true">{ICONS[variant] || ICONS.error}</span>
        <div className="flex-1">{message}</div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="-m-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold leading-none hover:bg-black/5"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
