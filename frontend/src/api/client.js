import axios from 'axios';
import { handleMockRequest } from './mockData';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for token refresh, or fallback to mock adapter if backend is not hosted on current domain (405/404/network error)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Check if error is 405 (Method Not Allowed from static host), 404, or network failure
    // If so, seamlessly fallback to local mock state so Vercel frontend demo functions 100% interactively!
    if (status === 405 || status === 404 || !error.response || status >= 500) {
      console.warn(`[Portal Demo Adapter] Backend unreachable or static 405. Handling via Mock Adapter: ${originalRequest.url}`);
      try {
        const mockData = await handleMockRequest(
          originalRequest.url,
          originalRequest.method,
          originalRequest.data
        );
        return {
          data: mockData,
          status: 200,
          statusText: 'OK (Demo Mode)',
          headers: {},
          config: originalRequest,
        };
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const authBase = import.meta.env.VITE_API_URL || '/api';
          const res = await axios.post(`${authBase}/auth/refresh/`, {
            refresh: refreshToken,
          });
          if (res.status === 200) {
            localStorage.setItem('access_token', res.data.access);
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
            originalRequest.headers['Authorization'] = `Bearer ${res.data.access}`;
            return api(originalRequest);
          }
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('portal_user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
