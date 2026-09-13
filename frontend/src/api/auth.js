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

export const fetchAllUsersAdmin = () =>
  axiosClient.get('/auth/admin/users').then((res) => res.data);
