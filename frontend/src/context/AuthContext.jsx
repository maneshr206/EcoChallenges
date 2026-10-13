import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const IS_LOCAL = !import.meta.env.VITE_COGNITO_USER_POOL_ID ||
  import.meta.env.VITE_COGNITO_USER_POOL_ID === 'us-east-1_PLACEHOLDER';

// ─── Real Cognito helpers (lazy-imported only when needed) ───────────────────
async function cognitoSignIn(email, password) {
  const { signIn } = await import('aws-amplify/auth');
  return signIn({ username: email, password });
}
async function cognitoSignUp(email, password, name) {
  const { signUp } = await import('aws-amplify/auth');
  return signUp({ username: email, password, options: { userAttributes: { email, name } } });
}
async function cognitoConfirm(email, code) {
  const { confirmSignUp } = await import('aws-amplify/auth');
  return confirmSignUp({ username: email, confirmationCode: code });
}
async function cognitoSignOut() {
  const { signOut } = await import('aws-amplify/auth');
  return signOut();
}
async function cognitoGetUser() {
  const { getCurrentUser } = await import('aws-amplify/auth');
  return getCurrentUser();
}
async function cognitoGetToken() {
  const { fetchAuthSession } = await import('aws-amplify/auth');
  const session = await fetchAuthSession();
  return session.tokens?.idToken?.toString() ?? null;
}


export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = useCallback(async () => {
    if (IS_LOCAL) {
      // Auto-login with mock user for local dev
      const stored = sessionStorage.getItem('mock_user');
      setUser(stored ? JSON.parse(stored) : null);
      setLoading(false);
      return;
    }
    try {
      const current = await cognitoGetUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const getToken = useCallback(async () => {
    if (IS_LOCAL) return 'mock-jwt-token';
    try { return await cognitoGetToken(); } catch { return null; }
  }, []);

  const login = useCallback(async (email, password) => {
    if (IS_LOCAL) {
      // Derive a stable userId from email
      const userId = 'user-' + email.replace('@', '_').replace('.', '_');
      const name   = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
      const u = {
        userId,
        username: userId,
        name,
        email,
        signInDetails: { loginId: email },
      };
      sessionStorage.setItem('mock_user', JSON.stringify(u));
      // Register user in mock API so profile has correct data
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, name, email }),
        });
      } catch { /* API may not be up yet */ }
      setUser(u);
      return u;
    }
    const result = await cognitoSignIn(email, password);
    await checkAuth();
    return result;
  }, [checkAuth]);

  const register = useCallback(async (email, password, name) => {
    if (IS_LOCAL) {
      const userId = 'user-' + email.replace('@', '_').replace('.', '_');
      const u = {
        userId,
        username: userId,
        name,
        email,
        signInDetails: { loginId: email },
      };
      sessionStorage.setItem('mock_user', JSON.stringify(u));
      // Register user in mock API so profile starts at zero points
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, name, email }),
        });
      } catch { /* API may not be up yet */ }
      setUser(u);
      return { isSignUpComplete: true, nextStep: { signUpStep: 'DONE' } };
    }
    return cognitoSignUp(email, password, name);
  }, []);

  const confirmRegistration = useCallback(async (email, code) => {
    if (IS_LOCAL) return { isSignUpComplete: true };
    return cognitoConfirm(email, code);
  }, []);

  const logout = useCallback(async () => {
    if (IS_LOCAL) { sessionStorage.removeItem('mock_user'); setUser(null); return; }
    await cognitoSignOut();
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
