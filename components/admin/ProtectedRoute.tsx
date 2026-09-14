import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  // 'authenticated' only requires a session (used by /onboarding — it can't
  // also require a business to exist, since creating one is its whole job).
  role: 'authenticated' | 'owner' | 'super_admin';
  children: React.ReactNode;
}

const FullScreenLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600" />
  </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ role, children }) => {
  const { session, profile, businesses, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/login" replace />;
  if (role === 'super_admin' && profile?.role !== 'super_admin') return <Navigate to="/admin" replace />;
  if (role === 'owner' && profile?.role !== 'super_admin' && businesses.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
