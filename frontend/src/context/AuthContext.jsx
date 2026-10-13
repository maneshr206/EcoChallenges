import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const IS_LOCAL = !import.meta.env.VITE_COGNITO_USER_POOL_ID ||
  import.meta.env.VITE_COGNITO_USER_POOL_ID === 'us-east-1_PLACEHOLDER';

// ─── Local mock user (used when no real Cognito is configured) ───────────────
const MOCK_USER = {
  userId:   'mock-user',
  username: 'mock-user',
  name:     'Manesh Ravikumar',
  email:    'manesh@example.com',
  signInDetails: { loginId: 'manesh@example.com' },
};

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
      const u = { ...MOCK_USER, email, signInDetails: { loginId: email } };
      sessionStorage.setItem('mock_user', JSON.stringify(u));
      setUser(u);
      return u;
    }
    const result = await cognitoSignIn(email, password);
    await checkAuth();
    return result;
  }, [checkAuth]);

  const register = useCallback(async (email, password, name) => {
    if (IS_LOCAL) {
      return { isSignUpComplete: false, nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } };
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
