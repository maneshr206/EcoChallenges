import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Password strength helpers ────────────────────────────────────────────────
function validatePassword(pw) {
  if (pw.length < 8)              return 'At least 8 characters required';
  if (!/[A-Z]/.test(pw))          return 'Must include at least one uppercase letter';
  if (!/[0-9]/.test(pw))          return 'Must include at least one number';
  if (!/[^A-Za-z0-9]/.test(pw))   return 'Must include at least one special character (e.g. @, !, #)';
  return '';
}

function passwordStrength(pw) {
  let s = 0;
  if (pw.length >= 8)             s++;
  if (/[A-Z]/.test(pw))           s++;
  if (/[0-9]/.test(pw))           s++;
  if (/[^A-Za-z0-9]/.test(pw))    s++;
  if (pw.length >= 12)            s++;
  return s;
}

const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const STRENGTH_COLOR = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-eco-500', 'bg-eco-600'];

// ── Resend countdown (60 s) ──────────────────────────────────────────────────
function useResendTimer(active) {
  const [secs, setSecs] = useState(60);
  useEffect(() => {
    if (!active) { setSecs(60); return; }
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [active, secs]);
  const reset = () => setSecs(60);
  return { secs, canResend: secs <= 0, reset };
}

export default function Register() {
  const { register, confirmRegistration, resendCode } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [step,    setStep]    = useState('register');
  const [form,    setForm]    = useState({ name: '', email: '', password: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const { secs, canResend, reset: resetTimer } = useResendTimer(step === 'confirm');

  // If redirected from Login with unconfirmed account, jump straight to confirm step
  useEffect(() => {
    const state = location.state;
    if (state?.step === 'confirm' && state?.email) {
      setForm((f) => ({ ...f, email: state.email }));
      setStep('confirm');
    }
  }, [location.state]);

  const strength      = passwordStrength(form.password);
  const strengthLabel = STRENGTH_LABEL[strength] || '';
  const strengthColor = STRENGTH_COLOR[strength] || '';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'password') setPwError('');
  };

  // ── Step 1: register ────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    const err = validatePassword(form.password);
    if (err) { setPwError(err); return; }

    setLoading(true);
    try {
      const result = await register(form.email, form.password, form.name);

      // Cognito will always require confirmation — go to OTP step
      if (result?.nextStep?.signUpStep === 'CONFIRM_SIGN_UP' || !result?.isSignUpComplete) {
        toast.success(`Code sent to ${form.email}! Check your inbox.`);
        setStep('confirm');
      } else {
        // Edge case: auto-confirmed (should not happen with our Cognito config)
        toast.success('Account created! Please sign in 🌿');
        navigate('/login');
      }
    } catch (err) {
      const code = err?.name || err?.code;
      if (code === 'UsernameExistsException') {
        toast.error('This email is already registered. Please sign in instead.');
      } else if (code === 'InvalidPasswordException') {
        toast.error('Password does not meet requirements.');
      } else {
        toast.error(err.message || 'Registration failed — please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: confirm OTP ─────────────────────────────────────────────────────
  const handleConfirm = async (e) => {
    e.preventDefault();
    if (form.code.length !== 6) { toast.error('Please enter the 6-digit code'); return; }
    setLoading(true);
    try {
      await confirmRegistration(form.email, form.code);
      toast.success('Email verified! You can now sign in 🌿');
      navigate('/login');
    } catch (err) {
      const code = err?.name || err?.code;
      if (code === 'CodeMismatchException') {
        toast.error('Incorrect code — please check and try again');
      } else if (code === 'ExpiredCodeException') {
        toast.error('Code has expired — please request a new one');
      } else if (code === 'NotAuthorizedException') {
        toast('Account already confirmed — please sign in', { icon: '✅' });
        navigate('/login');
      } else {
        toast.error(err.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!canResend) return;
    try {
      await resendCode(form.email);
      toast.success(`New code sent to ${form.email}`);
      resetTimer();
    } catch (err) {
      toast.error(err.message || 'Could not resend code');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-eco-50 px-4 py-8">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <Leaf size={40} className="text-eco-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'register' ? 'Join EcoChallenges' : 'Verify your email'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'register'
              ? 'Start your sustainability journey today'
              : `We sent a 6-digit code to`}
          </p>
          {step === 'confirm' && (
            <p className="text-eco-700 font-semibold text-sm mt-0.5">{form.email}</p>
          )}
        </div>

        {/* ── Register form ─────────────────────────────────────────────────── */}
        {step === 'register' && (
          <form onSubmit={handleRegister} className="card flex flex-col gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text" name="name" required autoComplete="name"
                value={form.name} onChange={handleChange}
                className="input" placeholder="Jane Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" name="email" required autoComplete="email"
                value={form.email} onChange={handleChange}
                className="input" placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password" name="password" required autoComplete="new-password"
                value={form.password} onChange={handleChange}
                className={`input ${pwError ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="Min. 8 chars, uppercase, number, symbol"
              />

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1.5 mb-1">
                    {[1,2,3,4,5].map((i) => (
                      <div key={i} className={`flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className={`text-xs ${strength <= 1 ? 'text-red-500' : strength <= 2 ? 'text-orange-500' : strength <= 3 ? 'text-yellow-600' : 'text-eco-600'}`}>
                    {strengthLabel}
                  </p>
                </div>
              )}

              {/* Requirements checklist */}
              {form.password.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {[
                    { rule: form.password.length >= 8,           text: 'At least 8 characters' },
                    { rule: /[A-Z]/.test(form.password),         text: 'One uppercase letter' },
                    { rule: /[0-9]/.test(form.password),         text: 'One number' },
                    { rule: /[^A-Za-z0-9]/.test(form.password),  text: 'One special character (@, !, # …)' },
                  ].map(({ rule, text }) => (
                    <li key={text} className={`flex items-center gap-1.5 text-xs ${rule ? 'text-eco-600' : 'text-gray-400'}`}>
                      <span>{rule ? '✓' : '○'}</span> {text}
                    </li>
                  ))}
                </ul>
              )}

              {pwError && <p className="text-xs text-red-500 mt-1 font-medium">{pwError}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>
        )}

        {/* ── OTP confirm form ──────────────────────────────────────────────── */}
        {step === 'confirm' && (
          <form onSubmit={handleConfirm} className="card flex flex-col gap-4">

            {/* Info banner */}
            <div className="flex items-start gap-2 bg-eco-50 border border-eco-200 rounded-lg px-3 py-2.5 text-sm text-eco-800">
              <Mail size={16} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Check your email</p>
                <p className="text-xs mt-0.5 text-eco-600">
                  We sent a 6-digit code to <strong>{form.email}</strong>. It expires in 24 hours. Check spam if you don't see it.
                </p>
              </div>
            </div>

            {/* OTP input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                name="code"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={form.code}
                onChange={handleChange}
                className="input text-center tracking-[0.6em] text-2xl font-mono"
                placeholder="······"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">{form.code.length}/6 digits</p>
            </div>

            {/* Verify button */}
            <button type="submit" disabled={loading || form.code.length !== 6} className="btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Verify email
                </span>
              )}
            </button>

            {/* Resend */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={!canResend}
                className={`flex items-center gap-1.5 mx-auto text-sm transition-colors ${
                  canResend ? 'text-eco-600 hover:text-eco-800' : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <RefreshCw size={13} />
                {canResend ? 'Resend code' : `Resend in ${secs}s`}
              </button>
            </div>

            {/* Back */}
            <button
              type="button"
              onClick={() => setStep('register')}
              className="text-xs text-gray-400 hover:text-gray-600 text-center"
            >
              ← Use a different email
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-eco-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
