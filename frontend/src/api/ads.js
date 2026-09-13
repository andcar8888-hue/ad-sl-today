import axiosClient from './axiosClient';

export const fetchAds = (params) => axiosClient.get('/ads', { params }).then((res) => res.data);

export const fetchAdById = (id) => axiosClient.get(`/ads/${id}`).then((res) => res.data);

export const fetchMyAds = () => axiosClient.get('/ads/mine').then((res) => res.data);

// Lightweight aggregate stats for the authenticated user's own ads, for the
// Dashboard's overview cards. Response shape:
// { totalAds, totalApproved, totalViews, totalLikes, pendingApprovalCount, pendingEditCount }
export const fetchMyAdsStats = () => axiosClient.get('/ads/mine/stats').then((res) => res.data);

// Delete one of the authenticated user's own ads (or any ad, if the caller
// is an admin — enforced server-side).
export const deleteAd = (id) => axiosClient.delete(`/ads/${id}`).then((res) => res.data);

// Owner-scoped single-ad lookup, regardless of status (e.g. pending_payment
// or rejected, not just approved) — used by the edit-ad page.
export const fetchMyAdById = (id) => axiosClient.get(`/ads/mine/${id}`).then((res) => res.data);

// `formData` must already contain title, description, whatsappNumber,
// telegramUsername (optional), category, and one or more `images` files.
export const createAd = (formData) =>
  axiosClient
    .post('/ads', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);

export const fetchAllAdsAdmin = (status) =>
  axiosClient.get('/ads/admin/all', { params: status ? { status } : {} }).then((res) => res.data);

export const approveAd = (id) => axiosClient.patch(`/ads/${id}/approve`).then((res) => res.data);

export const rejectAd = (id, reason) =>
  axiosClient.patch(`/ads/${id}/reject`, { reason }).then((res) => res.data);

// `payload` may include any of title, description, city, whatsappNumber,
// telegramUsername, category — only the provided fields are changed. Never
// changes the ad's status.
export const updateAdAdmin = (id, payload) =>
  axiosClient.patch(`/ads/${id}/admin`, payload).then((res) => res.data);

// `image` must be one of the ad's existing `ad.images` path strings
// (e.g. "/uploads/ads/xxx.jpg").
export const removeAdImage = (id, image) =>
  axiosClient.patch(`/ads/${id}/admin/images/remove`, { image }).then((res) => res.data);

// Toggles the current user's like on the ad. No request body. Response
// shape: `{ message, liked: boolean, likes: number }`. Requires the user to
// be logged in (protected route) — callers should redirect guests to
// /login rather than calling this.
export const toggleLikeAd = (id) => axiosClient.patch(`/ads/${id}/like`).then((res) => res.data);

// Owner submits a content edit for one of their own ads. `formData` must
// contain title/description/whatsappNumber/telegramUsername(optional)/
// city(optional)/category/existingImages(JSON-stringified array of kept
// image path strings)/images (new files). If the ad is currently approved,
// this stages the edit onto `ad.pendingChanges` for admin review — the live
// ad is untouched until approved. Otherwise it's applied directly.
export const submitEditRequest = (id, formData) =>
  axiosClient
    .post(`/ads/${id}/edit-request`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);

// Admin: list every ad with a pending edit, old (top-level) and new
// (`pendingChanges`) fields both populated for comparison.
export const fetchPendingEditsAdmin = () => axiosClient.get('/ads/admin/pending-edits').then((res) => res.data);

// Admin: approve a pending edit, merging it onto the live ad.
export const approveEditRequest = (id) => axiosClient.patch(`/ads/${id}/edit-request/approve`).then((res) => res.data);

// Admin: reject a pending edit. `reason` is optional.
export const rejectEditRequest = (id, reason) =>
  axiosClient.patch(`/ads/${id}/edit-request/reject`, reason ? { reason } : {}).then((res) => res.data);
