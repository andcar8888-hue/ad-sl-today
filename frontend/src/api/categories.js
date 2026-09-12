import axiosClient from './axiosClient';

export const fetchCategories = () => axiosClient.get('/categories').then((res) => res.data);

export const createCategory = (name) =>
  axiosClient.post('/categories', { name }).then((res) => res.data);

export const deleteCategory = (id) =>
  axiosClient.delete(`/categories/${id}`).then((res) => res.data);
