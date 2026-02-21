import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, ArrowRight, ChefHat } from '../ui/Icons';
import SocialAuth from './SocialAuth';

interface LoginPageProps {
  onLogin: (email: string, pass: string) => boolean;
  onNavigate: (view: 'register' | 'landing') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const success = onLogin(email, password);
      if (!success) {
        setError('Invalid email or password');
        setLoading(false);
      }
      // If success, parent handles navigation/state update
    }, 800);
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    setLoading(true);
    setError('');
    
    // Simulate social login delay
    setTimeout(() => {
      // In a real app, this would use the provider's SDK
      // Here we simulate it by attempting to login with a specific demo account
      // Note: This relies on the 'Register' page logic handling the auto-creation or App.tsx handling it
      // For this purely frontend demo, we will check if we can log in, or show a specific message
      
      const demoEmail = provider === 'google' ? 'demo@gmail.com' : 'demo@icloud.com';
      const demoPass = 'social_demo_pass'; // This needs to match a registered user or we simulate register
      
      // Attempt login (this will fail if user doesn't exist in our localStorage mock)
      const success = onLogin(demoEmail, demoPass);
      
      if (!success) {
        // Since we can't easily reach into App.tsx to 'Register' from the 'Login' component directly via props
        // We will show a friendly error or redirect to register for the demo flow
        setError(`No ${provider === 'google' ? 'Google' : 'Apple'} account found. Please Register first.`);
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 pb-6">
          <button 
            onClick={() => onNavigate('landing')}
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
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-slate-800 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4 shadow-lg shadow-slate-900/20"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>

          <SocialAuth mode="login" onSocialAuth={handleSocialLogin} isLoading={loading} />
        </form>

        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <button 
              onClick={() => onNavigate('register')}
              className="text-orange-600 font-bold hover:underline"
            >
              Get Started
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;