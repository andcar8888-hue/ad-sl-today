import { Link } from 'react-router-dom';

// Hardcoded rather than derived from `new Date()` — a legal document's
// "last updated" date should reflect when the CONTENT was last edited,
// not the date the page happens to be viewed.
const LAST_UPDATED = 'September 13, 2026';

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl py-6 sm:py-10">
      <Link to="/" className="inline-block text-sm font-medium text-primary hover:underline">
        &larr; Back to Home
      </Link>

      <article className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

        <hr className="mt-6 border-border" />

        <p className="mt-6 rounded-lg border border-border bg-surface-muted p-4 text-base leading-relaxed text-gray-700 sm:p-5">
          This is a preliminary Privacy Policy for AD SL Today, covering the basics of how we
          handle your information. A more detailed policy will follow as the platform grows.
        </p>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">Information We Collect</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>Account details you provide when registering: your name, email address, and password.</li>
            <li>Optional profile details you add: phone number, WhatsApp number, and Telegram username.</li>
            <li>
              Ad content you submit: titles, descriptions, images, city, category, and the
              contact details you choose to include on each ad.
            </li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">How We Use Your Information</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>To create and manage your account, and to let you post, edit, and track your ads.</li>
            <li>To verify manual bank-transfer payments against the user code you send us via WhatsApp.</li>
            <li>To communicate with you about your ads, account, or any issues you report.</li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">What&apos;s Shown Publicly</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>
              Once an ad is approved, its title, description, images, category, city, and the
              contact details you added to that specific ad (WhatsApp number, Telegram
              username) are visible to anyone browsing the site.
            </li>
            <li>Your account email and password are never shown publicly.</li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">Data Sharing</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>We do not sell your personal information to third parties.</li>
            <li>We do not share your account details with anyone outside AD SL Today except where required by law.</li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">Your Choices</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>You can update your name, phone, and default contact details at any time from your account dashboard.</li>
            <li>
              If you&apos;d like your account or data removed, contact us via the WhatsApp
              number shown on the Checkout page.
            </li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">Contact</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>Questions about this policy can be sent to us via the WhatsApp number shown on the Checkout page.</li>
          </ul>
        </section>
      </article>
    </div>
  );
}
