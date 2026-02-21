import React, { useState } from 'react';
import { Mail, Lock, User, ArrowLeft, ArrowRight, Store } from '../ui/Icons';
import SocialAuth from './SocialAuth';

interface RegisterPageProps {
  onRegister: (email: string, pass: string, name: string) => boolean;
  onNavigate: (view: 'login' | 'landing') => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegister, onNavigate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const success = onRegister(email, password, name);
      if (!success) {
        setError('Email already registered');
        setLoading(false);
      }
      // If success, parent handles navigation
    }, 800);
  };

  const handleSocialRegister = (provider: 'google' | 'apple') => {
    setLoading(true);
    
    setTimeout(() => {
      // Simulate OAuth Registration
      const demoEmail = provider === 'google' ? 'demo@gmail.com' : 'demo@icloud.com';
      const demoName = provider === 'google' ? 'Google Cafe' : 'Apple Bistro';
      const demoPass = 'social_demo_pass';

      const success = onRegister(demoEmail, demoPass, demoName);
      
      if (!success) {
        // If already exists, user should probably login, but for the demo we'll show an error
        setError(`This ${provider} account is already registered. Please Login.`);
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
            className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-orange-700 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4 shadow-lg shadow-orange-600/20"
          >
            {loading ? 'Creating Account...' : 'Get Started'}
            {!loading && <ArrowRight size={18} />}
          </button>

          <SocialAuth mode="register" onSocialAuth={handleSocialRegister} isLoading={loading} />
        </form>

        <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <button 
              onClick={() => onNavigate('login')}
              className="text-blue-600 font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;