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

export default function Alert({ variant = 'error', children, onClose }) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-md border px-4 py-3 text-sm ${VARIANT_STYLES[variant] || VARIANT_STYLES.info}`}
    >
      <span aria-hidden="true">{ICONS[variant] || ICONS.info}</span>
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="-m-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold leading-none hover:bg-black/5"
        >
          &times;
        </button>
      )}
    </div>
  );
}
