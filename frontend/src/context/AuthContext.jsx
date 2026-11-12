import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, ApiError } from '../services/api';

const AuthContext = createContext(null);

function getErrorMessage(error) {
  if (error instanceof ApiError) return error.message;
  return 'Unable to complete the request. Please try again.';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await apiRequest('/auth/refresh', { method: 'POST' });
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
      return response.data.accessToken;
    } catch (error) {
      setUser(null);
      setAccessToken(null);
      if (error.status !== 401) throw error;
      return null;
    }
  }, []);

  useEffect(() => {
    refreshSession().catch(() => undefined).finally(() => setLoading(false));
  }, [refreshSession]);

  const login = useCallback(async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    setUser(response.data.user);
    setAccessToken(response.data.accessToken);
    return response.data.user;
  }, []);

  const register = useCallback(async (details) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(details)
    });
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    await apiRequest('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    setAccessToken(null);
  }, []);

  const request = useCallback(async (path, options = {}) => {
    try {
      return await apiRequest(path, { ...options, token: accessToken });
    } catch (error) {
      if (error.status !== 401 || path === '/auth/refresh') throw error;
      const refreshedToken = await refreshSession();
      if (!refreshedToken) throw error;
      return apiRequest(path, { ...options, token: refreshedToken });
    }
  }, [accessToken, refreshSession]);

  const value = useMemo(() => ({
    user,
    accessToken,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    request,
    refreshSession,
    getErrorMessage
  }), [user, accessToken, loading, login, register, logout, request, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}

