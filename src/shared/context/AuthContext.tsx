import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@services/authService';
import type { User } from '@types';
import { supabase } from '@lib/supabase';

interface AuthContextValue {
  user: (User & { role?: 'student' | 'teacher' | 'admin'; created_at?: string | Date }) | null;
  loading: boolean;
  login: (email: string, password: string, role?: 'student' | 'teacher' | 'admin') => Promise<boolean>;
  loginWithGoogle: (role?: 'student' | 'teacher') => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: 'student' | 'teacher' | 'admin',
    bio?: string,
    specialization?: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
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
          const syncedUser = await authService.handleAuthStateChange(session);
          if (mounted && syncedUser) {
            setUser(syncedUser);
          }
        } else {
          // Fallback: Check localStorage if no Supabase session (though usually they sync)
          // or just clear it if we trust Supabase as single source of truth
          const localUser = authService.getCurrentUser();
          if (mounted && localUser) {
            // Optional: Validate local user? For now, trust it but maybe background re-verify
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
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session) {
          try {
            const syncedUser = await authService.handleAuthStateChange(session);
            if (syncedUser) {
              setUser(syncedUser);
            }
          } catch (error: any) {
            console.error('Auth sync error:', error);
            await authService.logout();
            setUser(null);
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

  const login = async (email: string, password: string, role: 'student' | 'teacher' | 'admin' = 'student') => {
    try {
      const credentials = { email, password, role };
      const loggedInUser = await authService.login(credentials);
      setUser(loggedInUser);

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (role: 'student' | 'teacher' = 'student') => {
    try {
      await authService.loginWithGoogle(role);
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    role: 'student' | 'teacher' | 'admin' = 'student',
    bio?: string,
    specialization?: string
  ) => {
    try {
      const userData = { email, password, name, role, bio, specialization };
      const registeredUser = await authService.register(userData);
      setUser(registeredUser);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('cyberSecUser');
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
      localStorage.setItem('cyberSecUser', JSON.stringify(updatedUser));
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isTeacher = () => {
    return user?.role === 'teacher';
  };

  const isStudent = () => {
    return user?.role === 'student';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, updateUser, isAdmin, isTeacher, isStudent }}>
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