import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf } from 'lucide-react';
import toast from 'react-hot-toast';

const IS_LOCAL = !import.meta.env.VITE_COGNITO_USER_POOL_ID ||
  import.meta.env.VITE_COGNITO_USER_POOL_ID === 'us-east-1_PLACEHOLDER';

export default function Register() {
  const { register, confirmRegistration } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]       = useState('register'); // 'register' | 'confirm'
  const [form, setForm]       = useState({ email: '', password: '', name: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'password') setPwError('');
  };

  const validatePassword = (pw) => {
    if (pw.length < 8)           return 'At least 8 characters required';
    if (!/[A-Z]/.test(pw))       return 'Must include at least one uppercase letter';
    if (!/[0-9]/.test(pw))       return 'Must include at least one number';
    if (!/[^A-Za-z0-9]/.test(pw)) return 'Must include at least one special character (e.g. @, !, #)';
    return '';
  };

  // Live password strength checker
  const passwordStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8)            score++;
    if (/[A-Z]/.test(pw))          score++;
    if (/[0-9]/.test(pw))          score++;
    if (/[^A-Za-z0-9]/.test(pw))   score++;
    if (pw.length >= 12)           score++;
    return score; // 0–5
  };

  const strength = passwordStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength] || '';
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-eco-500', 'bg-eco-600'][strength] || '';

  const handleRegister = async (e) => {
    e.preventDefault();
    const err = validatePassword(form.password);
    if (err) { setPwError(err); return; }

    setLoading(true);
    try {
      const result = await register(form.email, form.password, form.name);

      // Local mode OR Cognito says signup is already complete — go straight to feed
      if (result?.isSignUpComplete || result?.nextStep?.signUpStep === 'DONE') {
        toast.success(`Welcome to EcoChallenges, ${form.name}! 🌿`);
        navigate('/feed');
        return;
      }

      // Real Cognito — needs email confirmation
      toast.success('Account created! Check your email for a confirmation code.');
      setStep('confirm');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmRegistration(form.email, form.code);
      toast.success('Email confirmed! Please sign in 🌿');
      navigate('/login');
    } catch (err) {
      toast.error(err.message || 'Confirmation failed — check the code and try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-eco-50 px-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <Leaf size={40} className="text-eco-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'register' ? 'Join EcoChallenges' : 'Confirm your email'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'register'
              ? 'Start your sustainability journey today'
              : `We sent a 6-digit code to ${form.email}`}
          </p>
        </div>

        {/* ── Register form ───────────────────────────────────────────────── */}
        {step === 'register' && (
          <form onSubmit={handleRegister} className="card flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text" name="name" required autoComplete="name"
                value={form.name} onChange={handleChange}
                className="input" placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" name="email" required autoComplete="email"
                value={form.email} onChange={handleChange}
                className="input" placeholder="you@example.com"
              />
            </div>
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
                      <div
                        key={i}
                        className={`flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200'}`}
                      />
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
                    { rule: form.password.length >= 8,            text: 'At least 8 characters' },
                    { rule: /[A-Z]/.test(form.password),          text: 'One uppercase letter' },
                    { rule: /[0-9]/.test(form.password),          text: 'One number' },
                    { rule: /[^A-Za-z0-9]/.test(form.password),   text: 'One special character (@, !, # …)' },
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

        {/* ── Confirm form (only shown for real Cognito) ─────────────────── */}
        {step === 'confirm' && (
          <form onSubmit={handleConfirm} className="card flex flex-col gap-4">
            <p className="text-sm text-gray-600 bg-eco-50 border border-eco-200 rounded-lg px-3 py-2">
              📧 Check your inbox at <strong>{form.email}</strong> for a 6-digit code.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Code</label>
              <input
                type="text" name="code" required inputMode="numeric"
                value={form.code} onChange={handleChange}
                className="input text-center tracking-[0.5em] text-xl font-mono"
                placeholder="123456" maxLength={6}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Confirming…
                </span>
              ) : 'Confirm email'}
            </button>
            <button
              type="button"
              onClick={() => setStep('register')}
              className="text-sm text-gray-400 hover:text-gray-600 text-center"
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
