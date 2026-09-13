import axiosClient from './axiosClient';

export const fetchAdLevels = () => axiosClient.get('/ad-levels').then((res) => res.data);

export const fetchAllAdLevelsAdmin = () =>
  axiosClient.get('/ad-levels/admin/all').then((res) => res.data);

export const createAdLevel = (payload) =>
  axiosClient.post('/ad-levels', payload).then((res) => res.data);

export const updateAdLevel = (id, payload) =>
  axiosClient.patch(`/ad-levels/${id}`, payload).then((res) => res.data);

export const deleteAdLevel = (id) =>
  axiosClient.delete(`/ad-levels/${id}`).then((res) => res.data);
