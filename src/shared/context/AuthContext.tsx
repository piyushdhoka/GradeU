import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@services/authService';
import type { User } from '@types';
import { supabase } from '@lib/supabase';
import type { Session } from '@supabase/supabase-js';

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
    // Watchdog: never stay stuck on the loading screen if the profile request hangs
    const watchdog = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 10000);

    const finishLoading = () => {
      clearTimeout(watchdog);
      if (mounted) setLoading(false);
    };

    // The signed-in user is an admin only if their profile in the database says so;
    // anything else is signed out instead of being shown as some other role
    const syncSession = async (session: Session | null) => {
      if (!session) {
        if (mounted) setUser(null);
        finishLoading();
        return;
      }

      try {
        const syncedUser = await authService.handleAuthStateChange(session);
        if (!mounted) return;
        if (syncedUser?.role === 'admin') {
          setUser(syncedUser);
        } else {
          await authService.logout();
          setUser(null);
        }
      } catch {
        if (mounted) {
          await authService.logout();
          setUser(null);
        }
      } finally {
        finishLoading();
      }
    };

    // Single source of truth: INITIAL_SESSION covers page load, so there is no
    // separate getSession() path racing this one.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null);
        finishLoading();
        return;
      }
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Supabase holds its auth lock while this callback runs; awaiting another
        // Supabase call here deadlocks in browsers, so run the sync on the next tick
        setTimeout(() => syncSession(session), 0);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(watchdog);
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