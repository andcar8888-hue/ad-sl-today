import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../config';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT (when present) to every outgoing request.
axiosClient.interceptors.request.use((requestConfig) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

export default axiosClient;
