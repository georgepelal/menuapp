import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, ArrowRight, Store } from '../ui/Icons';
import SocialAuth from './SocialAuth';
import { useAuth } from '../../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email, password, name);
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    // AuthContext's onAuthStateChange handles the rest once a session exists.
    // If email confirmation is required, there's no session yet — tell the user.
    setConfirmationSent(true);
  };

  const handleSocialRegister = async (provider: 'google' | 'apple') => {
    if (provider !== 'google') return;
    setLoading(true);
    setError('');
    const { error: oauthError } = await signInWithGoogle();
    if (oauthError) {
      setError(oauthError);
      setLoading(false);
    }
    // On success the browser redirects away to Google, then to /auth/callback.
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <Mail size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Check your email</h2>
          <p className="text-slate-500 text-sm">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come
            back and sign in.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 pb-6">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Store size={32} />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">Create Account</h2>
          <p className="text-slate-500 text-center text-sm">Start building your smart menu today</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-0 pb-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Business Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="Cafe, Bar, or Restaurant Name"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="owner@business.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                placeholder="Min 6 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-orange-700 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4 shadow-lg shadow-orange-600/20 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Get Started'}
            {!loading && <ArrowRight size={18} />}
          </button>

          <SocialAuth mode="register" onSocialAuth={handleSocialRegister} isLoading={loading} />
        </form>

        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-blue-600 font-bold hover:underline">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
