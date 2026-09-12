import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const baseURL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

export const api = axios.create({
  baseURL,
  withCredentials: true, // important for sending/receiving the HttpOnly refresh token cookie
});

// Interceptor to add Authorization header
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Avoid circular dependency issues
import { useAuthStore } from '../store/auth.store';

export const authApi = {
  login: async (data: any) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  signup: async (data: any) => {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },
  refresh: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};
