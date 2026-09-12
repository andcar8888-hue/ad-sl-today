// Central place for env-driven config so the rest of the app never reads
// import.meta.env directly.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

// Server origin (no /api/v1) — ad images come back from the API as relative
// paths like "/uploads/ads/<file>.jpg" and need this prefix to render.
export const SERVER_ORIGIN = import.meta.env.VITE_SERVER_ORIGIN || 'http://localhost:5001';

export const AUTH_TOKEN_KEY = 'adsl_token';
export const AUTH_USER_KEY = 'adsl_user';
