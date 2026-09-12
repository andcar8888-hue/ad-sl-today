import { SERVER_ORIGIN } from '../config';

// Ad images come back from the API as relative paths (e.g. "/uploads/ads/x.jpg")
// and need the server origin prefixed to render as an <img src>.
export function resolveImageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SERVER_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
