import { Link } from 'react-router-dom';

// Hardcoded rather than derived from `new Date()` — a legal document's
// "last updated" date should reflect when the CONTENT was last edited,
// not the date the page happens to be viewed.
const LAST_UPDATED = 'September 13, 2026';

export default function Terms() {
  return (
    <div className="mx-auto max-w-2xl py-6 sm:py-10">
      <Link to="/" className="inline-block text-sm font-medium text-primary hover:underline">
        &larr; Back to Home
      </Link>

      <article className="mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-base text-gray-600">
          ඔබගේ පරිශීලක අවබෝධය සඳහා මෙම නියම හා කොන්දේසි කියවන්න.
        </p>
        <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

        <hr className="mt-6 border-border" />

        <p className="mt-6 rounded-lg border border-border bg-surface-muted p-4 text-base leading-relaxed text-gray-700 sm:p-5">
          Welcome to AD SL Today. By registering an account, posting an ad, or
          otherwise using this platform, you agree to the terms below. Please
          read them carefully.
        </p>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">1. Who Can Use AD SL Today</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>You must be at least 13 years old to register an account or post an ad.</li>
            <li>
              AD SL Today is a family-friendly platform. Adult content, dating/personal ads,
              and any content inappropriate for a general audience are never permitted, under
              any category or description.
            </li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">2. Posting Rules</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>Ads must be genuine, accurate, and represent an item or service you actually have available.</li>
            <li>Every ad must be placed in the correct category and city.</li>
            <li>Spam, duplicate postings, and misleading descriptions are not allowed.</li>
            <li>Fake ads, or ads intended to deceive buyers, are strictly prohibited.</li>
            <li>Listing illegal items or services is strictly prohibited.</li>
            <li>
              Adult content, personal/dating services, and anything inappropriate for a
              family audience are never allowed, regardless of category.
            </li>
            <li>
              Ads that don&apos;t meet these rules may be rejected or removed at any time,
              with or without prior notice.
            </li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">3. Ad Approval Process</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>
              After you submit an ad, you&apos;ll be taken to Checkout, where you complete a
              manual bank transfer for your chosen ad level and send your payment receipt
              plus your unique user code to our WhatsApp number.
            </li>
            <li>Our team manually verifies your payment before your ad is reviewed.</li>
            <li>
              An admin then reviews your ad&apos;s content against these terms. Only once
              both payment is confirmed and the ad is approved does it become publicly
              visible.
            </li>
            <li>
              Submitting an ad and completing payment does not guarantee approval — we may
              reject any ad that violates these terms.
            </li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">4. Responsibility &amp; Disclaimer</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>
              AD SL Today is an advertising platform only. We do not sell, manufacture, own,
              inspect, or guarantee any item or service listed by our users.
            </li>
            <li>
              We take no responsibility for the quality, safety, legality, or accuracy of any
              listing, or for the outcome of any transaction between a buyer and a seller.
            </li>
            <li>
              Any dealing between the ad&apos;s poster and a buyer is strictly between them —
              AD SL Today is not a party to that transaction and bears no liability for it.
            </li>
            <li>
              Always verify an item, service, and the other party carefully before completing
              any transaction, and meet in safe, public locations where possible.
            </li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">5. Removal of Ads</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>
              We reserve the right to remove, reject, or unpublish any ad that violates these
              terms — including but not limited to fake ads, duplicate ads, or prohibited
              content — at any time, with or without prior notice.
            </li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">6. Pricing &amp; Payments</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>
              Each ad level (Normal, Featured, Top Ad) has a price shown to you before you
              check out, payable only by manual bank transfer to the account details shown at
              Checkout.
            </li>
            <li>
              Payment is confirmed manually once you send your bank transfer receipt and user
              code to our WhatsApp number, and our team verifies it.
            </li>
            <li>
              Ad fees are non-refundable once an ad has been approved and published. If your
              ad is rejected, contact us via WhatsApp with your user code to discuss your
              options.
            </li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">7. Privacy</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>
              Contact details you provide on an ad (such as your WhatsApp number, Telegram
              username, and city) are shown publicly on that ad so buyers can reach you
              directly.
            </li>
            <li>For more on how we collect and use your information, see our Privacy Policy.</li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">8. Account Termination</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>
              We may suspend or permanently block any account that violates these terms,
              including for posting prohibited content, submitting fraudulent ads, or abusive
              behavior toward other users or our team.
            </li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">9. Changes to These Terms</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>
              We may update these terms from time to time. Continuing to use AD SL Today
              after a change means you accept the updated terms.
            </li>
          </ul>
        </section>

        <section className="mt-10 border-t border-border pt-8">
          <h2 className="text-xl font-semibold tracking-tight leading-snug text-ink">10. Contact</h2>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-relaxed text-gray-700 marker:text-primary">
            <li>
              If you have questions about these terms, please reach out to us via the
              WhatsApp number shown on the Checkout page.
            </li>
          </ul>
        </section>
      </article>
    </div>
  );
}
