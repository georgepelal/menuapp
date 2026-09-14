import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, ArrowRight, ChefHat } from '../ui/Icons';
import SocialAuth from './SocialAuth';
import { useAuth } from '../../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }

    navigate('/admin');
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    if (provider !== 'google') return;
    setLoading(true);
    setError('');
    const { error: oauthError } = await signInWithGoogle();
    if (oauthError) {
      setError(oauthError);
      setLoading(false);
    }
    // On success the browser redirects to Google, then back to /auth/callback.
  };

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
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
              <ChefHat size={32} />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">Welcome Back</h2>
          <p className="text-slate-500 text-center text-sm">Sign in to manage your menu</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-0 pb-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                placeholder="you@restaurant.com"
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
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-slate-800 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4 shadow-lg shadow-slate-900/20 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>

          <SocialAuth mode="login" onSocialAuth={handleSocialLogin} isLoading={loading} />
        </form>

        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="text-orange-600 font-bold hover:underline">
              Get Started
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
