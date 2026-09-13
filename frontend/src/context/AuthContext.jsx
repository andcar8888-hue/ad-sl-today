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

  // Merges `updatedFields` into the current cached `user` and re-persists it
  // to localStorage, without touching the token. Lets a successful profile
  // update (e.g. from the Dashboard's Account Settings form) immediately
  // sync the Navbar's "Hi, {name}" and any other user-derived UI, without a
  // full page reload or a second fetchMe() round-trip.
  const refreshUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Role-derived booleans, computed from the linear
  // user < moderator < admin_assistant < admin hierarchy. `isAdmin` keeps
  // its EXACT PREVIOUS MEANING (`role === 'admin'`) since existing code
  // depends on that — it is NOT "admin-tier or above", it is "the literal
  // top role". `isModerator`/`isManager` are the "this tier or above"
  // checks used to gate broader admin-panel access.
  const role = user?.role || null;
  const isModerator = role === 'moderator' || role === 'admin_assistant' || role === 'admin';
  const isManager = role === 'admin_assistant' || role === 'admin';
  const isAdmin = role === 'admin';

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    role,
    isModerator,
    isManager,
    isAdmin,
    loading,
    login,
    register,
    logout,
    refreshUser,
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
