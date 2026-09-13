// Sri Lankan WhatsApp number normalization, shared by every place that
// builds a `https://wa.me/<digits>` deep link (ContactActions/AdDetails,
// Checkout, etc.) so all the number formats users type resolve consistently.
//
// Strips all non-digit characters, then ensures the result is prefixed with
// the `94` country code (no leading `+` or `0`) since that's what wa.me expects:
//   "+94 71 234 5678" -> "94712345678"
//   "0712345678"       -> "94712345678" (typical local SL format)
//   "712345678"        -> "94712345678" (bare subscriber number)
export function toWhatsAppDigits(rawNumber) {
  if (!rawNumber) return '';
  const digits = String(rawNumber).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('94')) return digits;
  if (digits.startsWith('0')) return `94${digits.slice(1)}`;
  return `94${digits}`;
}

// E.164 format (leading +, no spaces) — what a `tel:` link needs, as opposed
// to toWhatsAppDigits' bare-digits format for wa.me links. Reuses the same
// underlying normalization so both formats agree on what "the number" is.
export function toE164(rawNumber) {
  const digits = toWhatsAppDigits(rawNumber);
  return digits ? `+${digits}` : '';
}
