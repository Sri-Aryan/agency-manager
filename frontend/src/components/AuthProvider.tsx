import React, { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';
import axios from 'axios';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setAuth, logout, setLoading } = useAuthStore();

  useEffect(() => {
    let isMounted = true;
    let refreshTimeout: ReturnType<typeof setTimeout>;

    const initAuth = async () => {
      try {
        const { user, accessToken } = await authApi.refresh();
        if (isMounted) {
          setAuth(user, accessToken);
          // Set up silent refresh before the token expires (e.g. at 14 minutes for a 15-minute token)
          // For simplicity, we just do a silent refresh every 14 minutes here
          refreshTimeout = setTimeout(initAuth, 14 * 60 * 1000);
        }
      } catch (error) {
        if (isMounted) {
          // Normal, user is not logged in or session expired
          logout();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Axios interceptor for handling 401s globally
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login' && originalRequest.url !== '/auth/refresh') {
          originalRequest._retry = true;
          try {
            const { user, accessToken } = await authApi.refresh();
            setAuth(user, accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
          } catch (e) {
            logout();
            return Promise.reject(e);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(refreshTimeout);
      axios.interceptors.response.eject(interceptor);
    };
  }, [setAuth, logout, setLoading]);

  return <>{children}</>;
};
