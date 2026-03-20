import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/lib/constants';

interface Profile {
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

const SEEDED_ADMIN_EMAIL = 'adminhr@gmail.com';
const DEFAULT_PROFILE_BY_EMAIL: Record<string, Profile> = {
  [SEEDED_ADMIN_EMAIL]: {
    first_name: 'System',
    last_name: 'Administrator',
    email: SEEDED_ADMIN_EMAIL,
  },
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  profile: Profile | null;
  authReady: boolean;
  isAuthenticated: boolean;
  isLoading: boolean; // legacy compat
  roleLoading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  forceLogout: () => Promise<void>;
  retrySession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const isAuthenticated = !!session?.user;
  // Legacy compat: isLoading = !authReady
  const isLoading = !authReady;

  const fetchRoleFromSchema = useCallback(async (schema: 'public', userId: string) => {
    const { data, error } = await supabase
      .schema(schema)
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    return { data, error };
  }, []);

  const fetchProfileFromSchema = useCallback(async (schema: 'public', userId: string) => {
    const { data, error } = await supabase
      .schema(schema)
      .from('profiles')
      .select('first_name, last_name, email, avatar_url')
      .eq('user_id', userId)
      .maybeSingle();

    return { data, error };
  }, []);

  const fetchUserRole = useCallback(async (userId: string): Promise<AppRole> => {
    setRoleLoading(true);
    try {
      console.log('[Auth] Fetching user role for:', userId);

      const publicResult = await fetchRoleFromSchema('public', userId);
      console.log('[Auth] Role fetch result (public):', publicResult);
      if (publicResult.data?.role) {
        return publicResult.data.role as AppRole;
      }

      return 'applicant';
    } catch (err) {
      console.error('[Auth] Role fetch error:', err);
      return 'applicant';
    } finally {
      setRoleLoading(false);
    }
  }, [fetchRoleFromSchema]);

  const buildFallbackProfile = useCallback((currentUser: User): Profile => {
    const email = currentUser.email ?? '';
    const firstName = currentUser.user_metadata?.first_name;
    const lastName = currentUser.user_metadata?.last_name;

    if (email && DEFAULT_PROFILE_BY_EMAIL[email]) {
      return DEFAULT_PROFILE_BY_EMAIL[email];
    }

    return {
      first_name: firstName || 'User',
      last_name: lastName || '',
      email,
      avatar_url: currentUser.user_metadata?.avatar_url,
    };
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    setProfileLoading(true);
    try {
      console.log('[Auth] Fetching profile for:', userId);

      const publicResult = await fetchProfileFromSchema('public', userId);
      console.log('[Auth] Profile fetch result (public):', publicResult);
      if (publicResult.data) {
        return publicResult.data;
      }

      return null;
    } catch (err) {
      console.error('[Auth] Profile fetch error:', err);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [fetchProfileFromSchema]);

  const loadUserData = useCallback(async (currentSession: Session | null) => {
    if (currentSession?.user) {
      console.log('[Auth] Session found, setting authReady immediately');
      setUser(currentSession.user);
      setSession(currentSession);
      setAuthReady(true); // Auth is ready immediately when session exists

      // Load role and profile in background (non-blocking)
      fetchUserRole(currentSession.user.id).then((resolvedRole) => {
        if (
          resolvedRole === 'applicant' &&
          currentSession.user.email === SEEDED_ADMIN_EMAIL
        ) {
          setRole('system_admin');
          return;
        }

        setRole(resolvedRole);
      });

      fetchProfile(currentSession.user.id).then((resolvedProfile) => {
        setProfile(resolvedProfile ?? buildFallbackProfile(currentSession.user));
      });
    } else {
      console.log('[Auth] No session, clearing state');
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
      setAuthReady(true);
    }
  }, [buildFallbackProfile, fetchUserRole, fetchProfile]);

  const initializeAuth = useCallback(async () => {
    if (!isSupabaseConfigured) {
      console.warn('[Auth] Supabase config is incomplete. Skipping session initialization.');
      setAuthReady(true);
      return () => {};
    }

    console.log('[Auth] Initializing auth...');
    
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[Auth] Auth state changed:', event);
        await loadUserData(currentSession);
      }
    );

    // Get initial session
    try {
      console.log('[Auth] Getting initial session...');
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      console.log('[Auth] Initial session result:', !!initialSession);
      await loadUserData(initialSession);
    } catch (err) {
      console.error('[Auth] Error getting session:', err);
      setAuthReady(true); // Still mark as ready even on error
    }

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  useEffect(() => {
    const cleanup = initializeAuth();
    return () => {
      cleanup.then(unsubscribe => unsubscribe?.());
    };
  }, [initializeAuth]);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error('Supabase publishable key is missing. Update .env and restart the dev server.'),
      };
    }

    console.log('[Auth] Signing in...');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    console.log('[Auth] Signing out...');
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
      return;
    }
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] Sign out error:', err);
    }
    // Clear state regardless
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  const forceLogout = async () => {
    console.log('[Auth] Force logout - clearing all auth data...');
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[Auth] Force logout signOut error:', err);
    }
    
    // Clear all Supabase-related localStorage keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear state
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
    setAuthReady(true);
  };

  const retrySession = async () => {
    console.log('[Auth] Retrying session...');
    setAuthReady(false);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      await loadUserData(currentSession);
    } catch (err) {
      console.error('[Auth] Retry session error:', err);
      setAuthReady(true);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      role,
      profile,
      authReady,
      isAuthenticated,
      isLoading,
      roleLoading,
      profileLoading,
      signIn,
      signOut,
      forceLogout,
      retrySession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
