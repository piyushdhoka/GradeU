"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@services/authService';
import type { User } from '@types';
import { supabase } from '@lib/supabase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (role?: 'student') => Promise<void>;

  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  isStudent: () => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Watchdog: ensure we never stay stuck in loading state
    const watchdog = setTimeout(() => {
      if (mounted && loading) {
        console.log('[AuthContext] Watchdog triggered - forcing loading to false');
        setLoading(false);
      }
    }, 8000);

    async function initializeAuth() {
      try {
        console.log('[AuthContext] Initializing auth...');
        
        // With implicit flow, Supabase automatically handles tokens in URL hash
        // detectSessionInUrl: true handles this automatically
        // Just need to get the session
        
        // Check if there are auth params in URL (hash fragments)
        const hasAuthHash = window.location.hash && window.location.hash.includes('access_token');
        
        if (hasAuthHash) {
          console.log('[AuthContext] Found auth tokens in URL hash');
          // Give Supabase a moment to process the hash
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Now check for session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Clean up URL - remove hash and query params
        if (hasAuthHash || window.location.hash || window.location.search.includes('code=')) {
          window.history.replaceState({}, '', window.location.pathname);
        }
        
        if (error) {
          console.log('[AuthContext] getSession error:', error.message);
        }

        console.log('[AuthContext] Session found:', !!session, session?.user?.id);

        if (session) {
          // If we have a session, sync with our DB to get role/profile
          const syncedUser = await authService.handleAuthStateChange(session) as AuthContextValue['user'];
          if (mounted && syncedUser && syncedUser.role !== 'admin' as any) {
            console.log('[AuthContext] User synced:', syncedUser.id);
            setUser(syncedUser);
          }
        } else {
          // Check localStorage as fallback
          const localUser = authService.getCurrentUser() as AuthContextValue['user'];
          if (mounted && localUser && localUser.role !== 'admin' as any) {
            console.log('[AuthContext] Using cached user:', localUser.id);
            setUser(localUser);
          }
        }
      } catch (error) {
        console.error('[AuthContext] Auth initialization error:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) {
          console.log('[AuthContext] Init complete, setting loading to false');
          setLoading(false);
        }
        clearTimeout(watchdog);
      }
    }

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Auth event: ${event}`, session?.user?.id);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session) {
          try {
            const syncedUser = await authService.handleAuthStateChange(session) as AuthContextValue['user'];
            if (syncedUser && syncedUser.role !== 'admin' as any) {
              setUser(prevUser => {
                // Protect against state downgrades
                const isSameUser = prevUser?.id === syncedUser.id;
                const wasOnboarded = prevUser?.onboarding_completed;
                const nowOnboarded = syncedUser.onboarding_completed;

                if (isSameUser && wasOnboarded && !nowOnboarded) {
                  console.warn('[AuthContext] Preventing state downgrade');
                  return prevUser;
                }
                return syncedUser;
              });
            }
            // Make sure loading is false after successful sign in
            setLoading(false);
          } catch (error: any) {
            console.error('[AuthContext] Auth sync error:', error);
            if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              console.warn('[AuthContext] Ignoring error on background update');
            } else {
              await authService.logout();
              setUser(null);
            }
            setLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] User signed out');
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, []);



  const loginWithGoogle = async (role: 'student' = 'student') => {
    try {
      await authService.loginWithGoogle(role);
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }



  const logout = async () => {
    setUser(null);
    localStorage.removeItem('gradeUUser');
    try {
      await authService.logout();
    } catch (error) {
      console.error('AuthService logout error:', error);
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('gradeUUser', JSON.stringify(updatedUser));
    }
  };

  const isStudent = () => {
    return user?.role === 'student';
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateUser, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (undefined === context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};