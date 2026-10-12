import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  confirmSignUp,
  fetchAuthSession,
} from 'aws-amplify/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Load current session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Returns the JWT id token for API calls
  const getToken = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() ?? null;
    } catch {
      return null;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await signIn({ username: email, password });
    await checkAuth();
    return result;
  }, [checkAuth]);

  const register = useCallback(async (email, password, name) => {
    return signUp({
      username: email,
      password,
      options: { userAttributes: { email, name } },
    });
  }, []);

  const confirmRegistration = useCallback(async (email, code) => {
    return confirmSignUp({ username: email, confirmationCode: code });
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, confirmRegistration, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
