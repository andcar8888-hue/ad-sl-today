import axiosClient from './axiosClient';

export const fetchAds = (params) => axiosClient.get('/ads', { params }).then((res) => res.data);

export const fetchAdById = (id) => axiosClient.get(`/ads/${id}`).then((res) => res.data);

export const fetchMyAds = () => axiosClient.get('/ads/mine').then((res) => res.data);

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
