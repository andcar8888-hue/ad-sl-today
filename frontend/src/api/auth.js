import axiosClient from './axiosClient';

export const registerUser = (payload) =>
  axiosClient.post('/auth/register', payload).then((res) => res.data);

export const loginUser = (payload) =>
  axiosClient.post('/auth/login', payload).then((res) => res.data);

export const fetchMe = () => axiosClient.get('/auth/me').then((res) => res.data);

// `payload` may include any of name/phone/whatsappNumber/telegramUsername —
// only the provided fields are changed. `email`/`role` are never accepted by
// the backend even if sent, so they're never part of this payload.
export const updateProfile = (payload) =>
  axiosClient.patch('/auth/me', payload).then((res) => res.data);

// `payload`: { currentPassword, newPassword }.
export const changePassword = (payload) =>
  axiosClient.patch('/auth/me/password', payload).then((res) => res.data);

// `params` may include any of { page, limit, search } — all optional,
// mirroring how `fetchAds` in api/ads.js passes a params object straight
// through to axios. Response shape: `{ users, pagination: { total, page,
// limit, pages } }`.
export const fetchAllUsersAdmin = (params) =>
  axiosClient.get('/auth/admin/users', { params }).then((res) => res.data);

// Admin-panel user management (admin_assistant+ at the route level, with
// additional in-controller guards — see backend/src/controllers/
// authController.js for the exact 403 boundaries around `role` and
// self-protection).

// `payload`: { name, email, password, role? }. `role` is only ever honored
// server-side for an actual `admin` caller — an admin_assistant sending ANY
// `role` field at all (even `'user'`) gets a 403, so callers below that tier
// must omit the field entirely rather than send a default.
export const createUserAdmin = (payload) =>
  axiosClient.post('/auth/admin/users', payload).then((res) => res.data);

// `payload` may include any of { name, email, phone, role } — only the
// provided fields are changed. Same `role`-requires-actual-admin rule as
// createUserAdmin applies here too, for ANY target user including self
// (self-role-change is always 403 regardless of caller's role).
export const updateUserAdmin = (id, payload) =>
  axiosClient.patch(`/auth/admin/users/${id}`, payload).then((res) => res.data);

// Block/unblock a user. Never allowed on the caller's own account (403).
export const toggleUserBlock = (id, blocked) =>
  axiosClient.patch(`/auth/admin/users/${id}/block`, { blocked }).then((res) => res.data);

// Permanently delete a user account. Admin-only server-side (403 for
// admin_assistant) and never allowed on the caller's own account.
export const deleteUserAdmin = (id) =>
  axiosClient.delete(`/auth/admin/users/${id}`).then((res) => res.data);
