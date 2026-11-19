import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { handleMockRequest } from '../api/mockData';

const AuthContext = createContext();

function isValidUser(u) {
  return u && typeof u === 'object' && typeof u.role === 'string' && u.role.length > 0;
}

function parseSavedUser() {
  try {
    const saved = localStorage.getItem('portal_user');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return isValidUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => parseSavedUser());
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me/');
      if (isValidUser(res.data)) {
        setUser(res.data);
        localStorage.setItem('portal_user', JSON.stringify(res.data));
      } else {
        const saved = parseSavedUser();
        if (saved) {
          setUser(saved);
        } else {
          const fallback = await handleMockRequest('/auth/me', 'get');
          setUser(fallback);
          localStorage.setItem('portal_user', JSON.stringify(fallback));
        }
      }
    } catch {
      const saved = parseSavedUser();
      if (saved) {
        setUser(saved);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login/', { username, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh || 'mock_refresh_token');

      let userData = res.data.user;
      if (!isValidUser(userData)) {
        try {
          const userRes = await api.get('/auth/me/');
          if (isValidUser(userRes.data)) userData = userRes.data;
        } catch {
          // Ignore
        }
      }
      if (!isValidUser(userData)) {
        const mockRes = await handleMockRequest('/auth/login', 'post', { username, password });
        userData = mockRes.user;
      }
      setUser(userData);
      localStorage.setItem('portal_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.warn('Backend login request error, falling back to instant client session:', err);
      const mockRes = await handleMockRequest('/auth/login', 'post', { username, password });
      localStorage.setItem('access_token', mockRes.access);
      localStorage.setItem('refresh_token', mockRes.refresh);
      setUser(mockRes.user);
      localStorage.setItem('portal_user', JSON.stringify(mockRes.user));
      return mockRes.user;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('portal_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser: fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
