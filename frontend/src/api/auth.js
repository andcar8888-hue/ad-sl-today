import axiosClient from './axiosClient';

export const registerUser = (payload) =>
  axiosClient.post('/auth/register', payload).then((res) => res.data);

export const loginUser = (payload) =>
  axiosClient.post('/auth/login', payload).then((res) => res.data);

export const fetchMe = () => axiosClient.get('/auth/me').then((res) => res.data);

export const fetchAllUsersAdmin = () =>
  axiosClient.get('/auth/admin/users').then((res) => res.data);
