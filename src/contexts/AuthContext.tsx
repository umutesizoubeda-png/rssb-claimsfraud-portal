/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import supabase from '../lib/supabase';
import type { Profile } from '../lib/types';
import { fetchProfile } from '../lib/profile';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null, session: null, profile: null, loading: true, refreshProfile: async () => {},
});

// fetchProfile moved to src/lib/profile.ts to keep this module focused on React providers

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (s: Session | null) => {
    setSession(s);
    setUser(s?.user ?? null);
    if (s?.user) setProfile(await fetchProfile(s.user.email));
    else setProfile(null);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => load(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => load(s));
    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user?.email) setProfile(await fetchProfile(user.email));
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
