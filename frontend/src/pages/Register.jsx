import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register, confirmRegistration } = useAuth();
  const navigate = useNavigate();
  const [step, setStep]     = useState('register'); // 'register' | 'confirm'
  const [form, setForm]     = useState({ email: '', password: '', name: '', code: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
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
      toast.error(err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-eco-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Leaf size={40} className="text-eco-500 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'register' ? 'Join EcoChallenges' : 'Confirm your email'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'register'
              ? 'Start your sustainability journey today'
              : `We sent a code to ${form.email}`}
          </p>
        </div>

        {step === 'register' ? (
          <form onSubmit={handleRegister} className="card flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" required value={form.name} onChange={handleChange}
                className="input" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange}
                className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" required minLength={8} value={form.password} onChange={handleChange}
                className="input" placeholder="Min. 8 characters" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="card flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Code</label>
              <input type="text" name="code" required value={form.code} onChange={handleChange}
                className="input text-center tracking-widest text-lg" placeholder="123456" maxLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Confirming…' : 'Confirm email'}
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
