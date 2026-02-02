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
    // Watchdog: ensure we never stay stuck in loading state due to network/cookie issues
    const watchdog = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 3500);

    async function initializeAuth() {
      try {
        // 1. Check for existing session from Supabase first
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // If we have a session, sync with our DB to get role/profile
          const syncedUser = await authService.handleAuthStateChange(session) as AuthContextValue['user'];
          if (mounted && syncedUser && syncedUser.role !== 'admin' as any) {
            setUser(syncedUser);
          }
        } else {
          // Fallback: Check localStorage if no Supabase session (though usually they sync)
          // or just clear it if we trust Supabase as single source of truth
          const localUser = authService.getCurrentUser() as AuthContextValue['user'];
          if (mounted && localUser && localUser.role !== 'admin' as any) {
            setUser(localUser);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
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
                // PROTECT AGAINST DOWNGRADES
                // If we already have a fully onboarded user state, and the new state claims we aren't onboarded,
                // it's likely a partial fetch/timeout issue. Ignore the downgrade.
                // Ensure we don't accidentally ignore legitimate re-logins for different users.
                const isSameUser = prevUser?.id === syncedUser.id;
                const wasOnboarded = prevUser?.onboarding_completed;
                const nowOnboarded = syncedUser.onboarding_completed;

                if (isSameUser && wasOnboarded && !nowOnboarded) {
                  console.warn('[AuthContext] Preventing state downgrade: Ignoring incomplete profile sync during session update.', { event });
                  // We return the previous user, effectively ignoring the "bad" update
                  return prevUser;
                }
                return syncedUser;
              });
            }
          } catch (error: any) {
            console.error('Auth sync error:', error);
            // If it's a background refresh or update, DO NOT LOG OUT. Just warn.
            if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
              console.warn('[AuthContext] Ignoring auth error on background update to prevent session loss', { event });
            } else {
              // For SIGNED_IN failures, we might fail hard, OR we could be lenient too?
              // Choosing to be strict for initial SIGNED_IN but lenient for everything else.
              await authService.logout();
              setUser(null);
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
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