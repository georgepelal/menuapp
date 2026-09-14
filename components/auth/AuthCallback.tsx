import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Landing spot for Supabase OAuth redirects. supabase-js's detectSessionInUrl
// exchanges the code for a session automatically; we just wait for
// AuthContext to pick it up and then route onward.
const AuthCallback: React.FC = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate(session ? '/admin' : '/login', { replace: true });
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600" />
        <p className="text-slate-500 font-medium animate-pulse">Signing you in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
