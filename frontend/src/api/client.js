import axios from 'axios';
import { handleMockRequest } from './mockData';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

function isHtmlOrInvalidJson(data, headers) {
  const ct = String(headers?.['content-type'] || headers?.['Content-Type'] || '').toLowerCase();
  if (ct.includes('text/html')) return true;
  if (typeof data === 'string' && (data.trim().startsWith('<!doctype') || data.trim().startsWith('<html'))) {
    return true;
  }
  return false;
}

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

// Intercept responses:
// 1. If a static SPA rewrite returns 200 OK with index.html instead of JSON, route through handleMockRequest!
// 2. If backend returns 405/404/500 or network error, route through handleMockRequest!
api.interceptors.response.use(
  async (response) => {
    if (isHtmlOrInvalidJson(response.data, response.headers)) {
      const cfg = response.config;
      const mockData = await handleMockRequest(cfg.url, cfg.method, cfg.data);
      return {
        ...response,
        data: mockData,
        status: 200,
        statusText: 'OK (Demo Mode - SPA Fallback)',
      };
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 405 || status === 404 || !error.response || status >= 500) {
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
          if (res.status === 200 && res.data?.access) {
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
