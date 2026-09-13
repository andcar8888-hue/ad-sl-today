// Shared WhatsApp / Call / Telegram / Share buttons for the Ad Details page.
// Rendered twice by the page (once inline, once in a mobile sticky bar) so
// the same contact actions are always reachable without scrolling back up.
//
// Compact mode (the mobile sticky bar) hides every button's text label, so
// WhatsApp, Call and Telegram all render as equal-weight icon-only buttons
// that share the row via flex-1 — this is what keeps the bar from
// overflowing a 320-375px phone once Call (and optionally Telegram) sit
// alongside WhatsApp and the separate FavouriteButton the page renders next
// to this component. Each still needs its own aria-label in compact mode
// since the visible text (its usual accessible name) is hidden; the label
// text always contains the visible label as a substring (WCAG 2.5.3).
// Share intentionally stays a fixed-width icon button (shrink-0, no
// flex-1) — it's a lower-priority utility action, not one of the two
// contact-critical actions (WhatsApp, Call) that must never lose space.
export default function ContactActions({ whatsappDigits, telegramHandle, telHref, onShare, compact = false }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? 'flex-1 min-w-0' : 'flex-wrap gap-3'}`}>
      <a
        href={`https://wa.me/${whatsappDigits}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with the ad owner on WhatsApp"
        className={`btn-success ${compact ? 'flex-1' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.38.26-.28.57-.35.76-.35h.55c.18 0 .41-.07.64.49.24.58.81 2.01.88 2.15.07.14.11.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.14-.28.29-.12.56.16.28.71 1.17 1.53 1.89 1.05.94 1.94 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.28.35-.23.6-.14.24.09 1.55.73 1.82.86.26.14.44.2.5.32.07.12.07.68-.17 1.36Z" />
        </svg>
        {!compact && 'WhatsApp'}
      </a>
      {/* btn-outline (red border/text, fills red on hover) rather than
          btn-secondary: Call is a same-tier contact action as WhatsApp, not
          a lesser/secondary one, so it borrows the app's primary red brand
          color instead of reading as generic gray chrome. Staying an
          outline (vs. WhatsApp/Telegram's filled brand colors) keeps it
          visually distinct as "our" action rather than a third brand. */}
      {telHref && (
        <a
          href={`tel:${telHref}`}
          aria-label="Call the ad owner"
          className={`btn-outline ${compact ? 'flex-1' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 6.75c0 8.284 6.716 15 15 15h1.5a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
            />
          </svg>
          {!compact && 'Call'}
        </a>
      )}
      {/* sky-700, not the brighter Telegram brand blue (#229ED9) — the brand
          blue only hits ~3:1 contrast with white text, which fails WCAG AA
          (4.5:1) for normal-sized button text. */}
      {telegramHandle && (
        <a
          href={`https://t.me/${telegramHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Message the ad owner on Telegram"
          className={`btn bg-sky-700 text-white hover:bg-sky-800 ${compact ? 'flex-1' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path d="M21.94 4.5 18.6 20.06c-.25 1.1-.9 1.37-1.82.85l-5.03-3.71-2.43 2.34c-.27.27-.5.5-1.02.5l.36-5.12L18.4 6.7c.4-.36-.09-.56-.62-.2L6.9 13.4l-4.94-1.55c-1.07-.34-1.09-1.07.23-1.58L20.6 3.6c.9-.33 1.68.2 1.34.9Z" />
          </svg>
          {!compact && 'Telegram'}
        </a>
      )}
      <button type="button" onClick={onShare} aria-label="Share this ad" className="btn-secondary shrink-0">
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
