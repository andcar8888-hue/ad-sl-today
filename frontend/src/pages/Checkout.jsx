import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { startCheckout } from '../api/checkout';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import { getErrorMessage } from '../utils/errors';
import { toWhatsAppDigits } from '../utils/phone';

export default function Checkout() {
  const { adId } = useParams();
  const [order, setOrder] = useState(null);
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    // Idempotent — safe to call again on refresh/direct link even if this
    // ad's checkout was already started.
    startCheckout(adId)
      .then((data) => {
        if (!active) return;
        setOrder(data.order);
        setBankDetails(data.bankDetails);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [adId]);

  const handleCopyCode = async () => {
    if (!order) return;
    await navigator.clipboard.writeText(order.userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !order || !bankDetails) {
    return (
      <div className="mx-auto max-w-lg py-10">
        <Alert variant="error">{error || 'ගෙවීම් විස්තර පූරණය කළ නොහැක.'}</Alert>
        <Link to="/" className="mt-4 inline-block font-medium text-primary hover:underline">
          &larr; මුල් පිටුවට
        </Link>
      </div>
    );
  }

  const whatsappDigits = toWhatsAppDigits(bankDetails.whatsappNumber);
  const message = `ආයුබෝවන්, මම AD SL Today හි මගේ දැන්වීමට බැංකු ට්‍රාන්ස්ෆරයක් කළා. මගේ පරිශීලක කේතය: ${order.userCode}. ගෙවීම් රිසිට් පත ඇමිණ ඇත.`;
  const whatsappLink = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(message)}`;
  const isConfirmed = order.status === 'confirmed';

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Checkout — ගෙවීම සම්පූර්ණ කරන්න</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
          තත්ත්වය: <StatusBadge status={isConfirmed ? 'confirmed' : 'pending_payment'} />
        </p>
      </div>

      {/* Bank details: what to pay to. */}
      <div className="space-y-3 rounded-lg border border-border bg-surface p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-4 w-4" aria-hidden="true">
            <path d="M3 10h18M5 10v9m4-9v9m6-9v9m4-9v9M3 19h18M12 3l9 5H3l9-5Z" />
          </svg>
          බැංකු ගිණුම් තොරතුරු
        </h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-gray-500">ගිණුම් හිමියාගේ නම</dt>
            <dd className="font-medium text-ink">{bankDetails.accountName}</dd>
          </div>
          <div>
            <dt className="text-gray-500">ගිණුම් අංකය</dt>
            <dd className="font-mono text-base font-semibold tracking-wide text-ink">
              {bankDetails.accountNumber}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">බැංකුව</dt>
            <dd className="font-medium text-ink">{bankDetails.bankName}</dd>
          </div>
          <div>
            <dt className="text-gray-500">ශාඛාව</dt>
            <dd className="font-medium text-ink">{bankDetails.branch}</dd>
          </div>
        </dl>
      </div>

      {/* User code: the single most important piece of info on this page. */}
      <div className="space-y-3 rounded-lg border-2 border-dashed border-primary bg-primary/5 p-5 text-center">
        <p className="text-sm font-medium text-ink-light">
          ඔබගේ අනන්‍ය පරිශීලක කේතය &mdash; රිසිට් පත එවන විට මෙය සඳහන් කරන්න
        </p>
        <p className="select-all break-all rounded-md bg-white py-3 font-mono text-3xl font-extrabold tracking-[0.2em] text-primary shadow-inner sm:text-4xl">
          {order.userCode}
        </p>
        <button
          type="button"
          onClick={handleCopyCode}
          aria-live="polite"
          className={copied ? 'btn-success mx-auto' : 'btn-outline mx-auto'}
        >
          {copied ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              පිටපත් කළා!
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
                <rect x="9" y="9" width="11" height="11" rx="1.5" />
                <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
              </svg>
              කේතය පිටපත් කරන්න
            </>
          )}
        </button>
      </div>

      {/* The clear next step. */}
      {/* whitespace-normal + text-center override .btn-success's default
          whitespace-nowrap — this Sinhala label is long enough to risk
          overflowing a 360px-wide screen otherwise, so let it wrap to two
          lines instead. */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-success w-full whitespace-normal text-center text-base leading-snug"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 shrink-0" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.38.26-.28.57-.35.76-.35h.55c.18 0 .41-.07.64.49.24.58.81 2.01.88 2.15.07.14.11.31.02.5-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.14-.28.29-.12.56.16.28.71 1.17 1.53 1.89 1.05.94 1.94 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.28.35-.23.6-.14.24.09 1.55.73 1.82.86.26.14.44.2.5.32.07.12.07.68-.17 1.36Z" />
        </svg>
        WhatsApp හරහා රිසිට් පත එවන්න
      </a>

      <div className="space-y-2 rounded-lg border border-border bg-surface-muted/60 p-5 text-sm text-gray-600">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          මින් පසු සිදුවන්නේ කුමක්ද?
        </h2>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>ඉහත බැංකු ගිණුමට දැන්වීම් ගාස්තුව ට්‍රාන්ස්ෆර් කරන්න.</li>
          <li>
            ඉහත <span className="font-medium text-ink">WhatsApp හරහා රිසිට් පත එවන්න</span> ඔබන්න, ගෙවීම්
            රිසිට් පත ඇමිණන්න (ඔබගේ පරිශීලක කේතය ස්වයංක්‍රීයව ඇතුළත් වේ).
          </li>
          <li>අපගේ කණ්ඩායම ඔබගේ ගෙවීම තහවුරු කර දැන්වීම සමාලෝචනය කරනු ඇත.</li>
          <li>අනුමත වූ පසු ඔබගේ දැන්වීම ප්‍රසිද්ධියේ පළ වේ.</li>
        </ol>
      </div>

      <Link to="/" className="inline-block text-sm font-medium text-primary hover:underline">
        &larr; මුල් පිටුවට
      </Link>
    </div>
  );
}
