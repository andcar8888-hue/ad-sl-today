import axiosClient from './axiosClient';

// Idempotent — safe to call even if checkout was already started for this ad.
export const startCheckout = (adId) =>
  axiosClient.post('/checkout', { adId }).then((res) => res.data);

export const fetchCheckoutByAd = (adId) =>
  axiosClient.get(`/checkout/${adId}`).then((res) => res.data);

export const fetchAllOrdersAdmin = () =>
  axiosClient.get('/checkout/admin/all').then((res) => res.data);

export const confirmOrderPayment = (id) =>
  axiosClient.patch(`/checkout/${id}/confirm`).then((res) => res.data);
