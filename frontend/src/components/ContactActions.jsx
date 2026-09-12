// Shared WhatsApp / Telegram / Share buttons for the Ad Details page.
// Rendered twice by the page (once inline, once in a mobile sticky bar) so
// the same contact actions are always reachable without scrolling back up.
export default function ContactActions({ whatsappDigits, telegramHandle, onShare, compact = false }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap gap-3'}`}>
      <a
        href={`https://wa.me/${whatsappDigits}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn-success ${compact ? 'flex-1' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.38.26-.28.57-.35.76-.35h.55c.18 0 .41-.07.64.49.24.58.81 2.01.88 2.15.07.14.11.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.14-.28.29-.12.56.16.28.71 1.17 1.53 1.89 1.05.94 1.94 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.28.35-.23.6-.14.24.09 1.55.73 1.82.86.26.14.44.2.5.32.07.12.07.68-.17 1.36Z" />
        </svg>
        WhatsApp
      </a>
      {/* sky-700, not the brighter Telegram brand blue (#229ED9) — the brand
          blue only hits ~3:1 contrast with white text, which fails WCAG AA
          (4.5:1) for normal-sized button text. */}
      {telegramHandle && (
        <a
          href={`https://t.me/${telegramHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn bg-sky-700 text-white hover:bg-sky-800 ${compact ? 'flex-1' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path d="M21.94 4.5 18.6 20.06c-.25 1.1-.9 1.37-1.82.85l-5.03-3.71-2.43 2.34c-.27.27-.5.5-1.02.5l.36-5.12L18.4 6.7c.4-.36-.09-.56-.62-.2L6.9 13.4l-4.94-1.55c-1.07-.34-1.09-1.07.23-1.58L20.6 3.6c.9-.33 1.68.2 1.34.9Z" />
          </svg>
          Telegram
        </a>
      )}
      <button type="button" onClick={onShare} aria-label="Share this ad" className="btn-secondary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" />
        </svg>
        {!compact && 'Share'}
      </button>
    </div>
  );
}
