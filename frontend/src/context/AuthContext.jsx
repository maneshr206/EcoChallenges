/**
 * AuthContext — always uses real AWS Cognito.
 * No local bypass. Email verification is always required on signup.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  resendSignUpCode,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { checkAuth(); }, [checkAuth]);

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

  // Returns the Cognito JWT id token for API calls
  const getToken = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() ?? null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Sign in with email + password.
   * Throws if credentials wrong, email not confirmed, etc.
   */
  const login = useCallback(async (email, password) => {
    const result = await signIn({ username: email.toLowerCase().trim(), password });
    await checkAuth();
    return result;
  }, [checkAuth]);

  /**
   * Register a new account.
   * Cognito sends a 6-digit OTP to the email address.
   * Returns { isSignUpComplete, nextStep } — caller shows confirm screen when
   * nextStep.signUpStep === 'CONFIRM_SIGN_UP'.
   * Throws UsernameExistsException if the email is already registered.
   */
  const register = useCallback(async (email, password, name) => {
    return signUp({
      username: email.toLowerCase().trim(),
      password,
      options: {
        userAttributes: {
          email: email.toLowerCase().trim(),
          name,
        },
      },
    });
  }, []);

  /**
   * Confirm registration with the 6-digit OTP sent to email.
   * After this Cognito marks the account as CONFIRMED and fires
   * the PostConfirmation Lambda which creates the DynamoDB profile.
   */
  const confirmRegistration = useCallback(async (email, code) => {
    return confirmSignUp({
      username: email.toLowerCase().trim(),
      confirmationCode: code.trim(),
    });
  }, []);

  /**
   * Resend the OTP if the user didn't receive it.
   */
  const resendCode = useCallback(async (email) => {
    return resendSignUpCode({ username: email.toLowerCase().trim() });
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      confirmRegistration,
      resendCode,
      logout,
      getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
