import axiosClient from './axiosClient';

export const fetchCategories = () => axiosClient.get('/categories').then((res) => res.data);

export const createCategory = (name) =>
  axiosClient.post('/categories', { name }).then((res) => res.data);

export const deleteCategory = (id, reassignTo) =>
  axiosClient
    .delete(`/categories/${id}`, { params: reassignTo ? { reassignTo } : {} })
    .then((res) => res.data);
