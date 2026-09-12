// Truncates to ~maxLength characters, then backs off to the last whitespace
// boundary before the cutoff (avoids both mid-word cuts and reduces the
// chance of landing inside a Sinhala combining-character cluster, since
// clusters don't span spaces), appending an ellipsis only if it truncated.
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text || '';
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
