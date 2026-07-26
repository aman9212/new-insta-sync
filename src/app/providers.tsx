import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';
import { ThemeProvider } from '../providers/ThemeProvider';

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  error: string | null;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<Profile | null>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const configured = Boolean(supabase);

  const refreshProfile = async (): Promise<Profile | null> => {
    if (!supabase || !supabase.auth) return null;
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        setProfile(null);
        return null;
      }

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', auth.user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Unable to load profile', fetchError);
        setError(`Profile load failed: ${fetchError.message}`);
        setProfile(null);
        return null;
      }

      const typedProfile = data as Profile | null;
      setProfile(typedProfile);
      setError(null);
      return typedProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown profile fetch error';
      console.error('Profile refresh error:', message);
      setError(message);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!supabase || !supabase.auth) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        await refreshProfile();
      }
      setLoading(false);
    }).catch((err) => {
      if (!mounted) return;
      console.error('Session init error:', err);
      setError(err instanceof Error ? err.message : 'Session init failed');
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (nextSession) {
        void refreshProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    configured,
    loading,
    error,
    session,
    user: session?.user ?? null,
    profile,
    refreshProfile,
    signInWithGoogle: async () => {
      if (!supabase || !supabase.auth) return;
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (oauthError) throw oauthError;
    },
    signOut: async () => {
      if (!supabase || !supabase.auth) return;
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setError(null);
    },
  }), [configured, loading, error, session, profile]);

  return (
    <ThemeProvider>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </ThemeProvider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used inside AppProviders');
  return context;
}
