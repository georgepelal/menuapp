import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, ArrowRight } from '../ui/Icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

// Shown after a real sign-in when the account has no business yet — covers
// first-time Google OAuth users (who never filled in RegisterPage's business
// name field) and any edge case where signup's pending-name flow didn't run.
const OnboardingPage: React.FC = () => {
  const { createBusiness } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createBusiness(name.trim());
      navigate('/admin', { replace: true });
    } catch (err: any) {
      addToast('error', err.message || 'Could not create your business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
            <ChefHat size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 text-center mb-2">Name your venue</h2>
        <p className="text-slate-500 text-center text-sm mb-6">One last step before your dashboard is ready.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Coastal Breeze Cafe"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-slate-800 transition-transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Continue'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
