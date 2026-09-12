import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchMe, loginUser, registerUser } from '../api/auth';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
  }, []);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  // On first load, re-verify any persisted token against the API so a stale
  // or invalidated token doesn't silently leave the UI in a logged-in state.
  useEffect(() => {
    let active = true;

    if (!token) {
      setLoading(false);
      return undefined;
    }

    fetchMe()
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      })
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await loginUser({ email, password });
      persistSession(data.token, data.user);
      return data.user;
    },
    [persistSession]
  );

  const register = useCallback(
    async (name, email, password) => {
      const data = await registerUser({ name, email, password });
      persistSession(data.token, data.user);
      return data.user;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    isAdmin: user?.role === 'admin',
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
