import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { fetchProfile, fetchBusinessesForOwner, createBusiness as createBusinessRow } from '../services/supabaseData';
import { Business, Profile } from '../types';
import { ACTIVE_BUSINESS_STORAGE_KEY as ACTIVE_BUSINESS_KEY } from '../services/constants';

const PENDING_BUSINESS_NAME_KEY = 'gourmet_pending_business_name';

interface AuthContextValue {
  session: Session | null;
  user: SupabaseUser | null;
  profile: Profile | null;
  businesses: Business[];
  activeBusinessId: string | null;
  activeBusiness: Business | null;
  setActiveBusinessId: (id: string) => void;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, businessName: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  createBusiness: (name: string) => Promise<Business>;
  refreshBusinesses: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_BUSINESS_KEY)
  );
  const [loading, setLoading] = useState(true);
  // Prevents two overlapping onAuthStateChange events from both trying to
  // create a business for the same pending signup.
  const creatingPendingBusiness = useRef(false);

  const setActiveBusinessId = useCallback((id: string) => {
    localStorage.setItem(ACTIVE_BUSINESS_KEY, id);
    setActiveBusinessIdState(id);
  }, []);

  const loadUserData = useCallback(async (currentSession: Session) => {
    const userId = currentSession.user.id;
    const [profileRow, businessRows] = await Promise.all([
      fetchProfile(userId),
      fetchBusinessesForOwner(userId),
    ]);
    setProfile(profileRow);

    let finalBusinesses = businessRows;

    // Handle a business name captured at registration but not yet created
    // (e.g. because email confirmation was required and no session existed
    // at signUp time). Also covers a first-time Google OAuth sign-in.
    const pendingName = localStorage.getItem(PENDING_BUSINESS_NAME_KEY);
    if (finalBusinesses.length === 0 && pendingName && !creatingPendingBusiness.current) {
      creatingPendingBusiness.current = true;
      try {
        const created = await createBusinessRow(userId, pendingName);
        finalBusinesses = [created];
        localStorage.removeItem(PENDING_BUSINESS_NAME_KEY);
      } finally {
        creatingPendingBusiness.current = false;
      }
    }

    setBusinesses(finalBusinesses);
    setActiveBusinessIdState(prev => {
      if (prev && finalBusinesses.some(b => b.id === prev)) return prev;
      const fallback = finalBusinesses[0]?.id ?? null;
      if (fallback) localStorage.setItem(ACTIVE_BUSINESS_KEY, fallback);
      return fallback;
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await loadUserData(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession) {
        await loadUserData(newSession);
      } else {
        setProfile(null);
        setBusinesses([]);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signUp = async (email: string, password: string, businessName: string): Promise<{ error?: string }> => {
    localStorage.setItem(PENDING_BUSINESS_NAME_KEY, businessName);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      localStorage.removeItem(PENDING_BUSINESS_NAME_KEY);
      return { error: error.message };
    }
    // If email confirmation is disabled, a session comes back immediately
    // and onAuthStateChange will pick up the pending business name.
    // Otherwise it's created on first real sign-in.
    if (!data.session) {
      return {};
    }
    return {};
  };

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return error ? { error: error.message } : {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(ACTIVE_BUSINESS_KEY);
  };

  const createBusiness = async (name: string): Promise<Business> => {
    if (!session) throw new Error('Must be signed in to create a business');
    const created = await createBusinessRow(session.user.id, name);
    setBusinesses(prev => [...prev, created]);
    setActiveBusinessId(created.id);
    return created;
  };

  const refreshBusinesses = async () => {
    if (!session) return;
    const rows = await fetchBusinessesForOwner(session.user.id);
    setBusinesses(rows);
  };

  const activeBusiness = businesses.find(b => b.id === activeBusinessId) ?? null;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        businesses,
        activeBusinessId,
        activeBusiness,
        setActiveBusinessId,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        createBusiness,
        refreshBusinesses,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
