import { supabase } from '@lib/supabase';
import type { User } from '@types';

type DBUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
  password_hash?: string | null;
  [key: string]: unknown;
};

// Timeout wrapper to prevent infinite hanging
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 15000,
  operationName: string = 'Operation'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operationName} timed out after ${timeoutMs / 1000} seconds. Please check your internet connection and try again.`)),
        timeoutMs
      )
    )
  ]);
}

// Simple UUID v4 generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function sanitizeUser(dbUser: DBUser): User {
  const copy: Record<string, unknown> = { ...dbUser };

  // Transform DB fields to frontend CamelCase
  if ('completed_assessment' in copy) {
    copy['completedAssessment'] = copy['completed_assessment'];
    delete copy['completed_assessment'];
  }

  // Handle other potential mappings if needed
  if ('created_at' in copy) {
    copy['createdAt'] = copy['created_at'];
    delete copy['created_at'];
  }

  // remove password_hash if present
  if ('password_hash' in copy) {
    delete copy['password_hash'];
  }

  return copy as unknown as User;
}

class AuthService {
  async login(credentials: { email: string; password: string; role: string }): Promise<User | null> {
    try {
      const { data: signInData, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        }),
        60000,
        'Login'
      );

      if (signInError) {
        // Map common Supabase errors to user-friendly messages
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        }
        if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before logging in. Check your inbox for the confirmation link.');
        }

        // If supabase auth fails, fall back to legacy DB check (maintains compatibility)
        const { data: user, error } = await withTimeout(
          supabase
            .from('users')
            .select('*')
            .ilike('email', credentials.email)
            .eq('role', credentials.role)
            .maybeSingle() as unknown as Promise<any>,
          10000,
          'Database query'
        ) as any;

        if (error) {
          throw new Error(`Database error during login: ${error.message}`);
        }

        if (!user) {
          throw new Error(`No ${credentials.role} account found with email: ${credentials.email}`);
        }

        throw new Error('Please use Supabase authentication. If this persists, contact support.');
      }

      // Fetch profile row for signed-in user
      const sessionUser = signInData.user;
      if (!sessionUser) {
        throw new Error('Signed in but no user returned from Supabase Auth');
      }

      let profile: any = null;
      let profileError: any = null;

      try {
        const result = await withTimeout(
          supabase
            .from('users')
            .select('*')
            .eq('email', sessionUser.email?.toLowerCase() || '')
            .maybeSingle() as unknown as Promise<any>,
          15000,
          'Profile fetch'
        ) as any;
        profile = result.data;
        profileError = result.error;
      } catch (err) {
        profileError = err;
      }

      // Verify role matches credentials
      if (profile && profile.role !== credentials.role) {
        await supabase.auth.signOut();
        throw new Error(`Access Denied: This email is registered as a ${profile.role}. Please login as a ${profile.role}.`);
      }

      const profileRow = profile ? (profile as DBUser) : undefined;
      let profileCopy: User;

      if (profileRow) {
        profileCopy = sanitizeUser(profileRow);
      } else {
        profileCopy = {
          id: sessionUser.id,
          email: sessionUser.email!,
          name: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
          role: credentials.role,
          completedAssessment: false,
          level: 'beginner'
        } as User;

        // Try to create the profile in background if it's missing (not on timeout)
        if (!profileError) {
          supabase.from('users').upsert([{
            id: sessionUser.id,
            email: sessionUser.email,
            name: profileCopy.name,
            role: credentials.role,
            password_hash: 'SUPABASE_AUTH'
          }]);
        }
      }

      // store to localStorage without password_hash
      localStorage.setItem('cyberSecUser', JSON.stringify(profileCopy));
      // Clear any pending role artifacts
      localStorage.removeItem('auth_pending_role');
      localStorage.removeItem('auth_pending_role_ts');

      return profileCopy;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('timed out')) {
          throw new Error('Login is taking too long. Please check your internet connection and try again.');
        }
        if (error.message.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        throw error;
      }

      throw new Error('An unexpected error occurred during login. Please try again.');
    }
  }

  async register(userData: {
    email: string;
    password: string;
    name?: string;
    role: string;
    bio?: string;
    specialization?: string
  }): Promise<User | null> {
    try {
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const { data: signUpData, error: signUpError } = await withTimeout(
        supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              full_name: userData.name,
              role: userData.role
            }
          }
        }),
        60000,
        'Sign up'
      );

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          throw new Error('This email is already registered. Please login instead.');
        }
        if (signUpError.message.includes('invalid email')) {
          throw new Error('Please enter a valid email address.');
        }
      }

      const authUser = signUpData?.user;
      const session = signUpData?.session;

      if (authUser && !session) {
        throw new Error('Success! Please check your email and click the confirmation link to activate your account.');
      }

      const userId = authUser?.id ?? generateUUID();

      const profileRow = {
        id: userId,
        email: userData.email,
        name: userData.name || 'User',
        role: userData.role,
        password_hash: 'SUPABASE_AUTH',
        level: 'beginner',
        completed_assessment: userData.role === 'admin',
        bio: userData.bio || '',
        specialization: userData.specialization || '',
        experience_years: userData.role === 'student' ? null : '0-1'
      } as Record<string, unknown>;

      const { data: newUser, error: profileError } = await withTimeout(
        supabase
          .from('users')
          .upsert([profileRow], { onConflict: 'id' })
          .select()
          .maybeSingle() as unknown as Promise<any>,
        60000,
        'Profile creation'
      ) as any;

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      const finalUser = newUser || profileRow;
      const newUserCopy = { ...finalUser } as unknown as User;
      delete (newUserCopy as any).password_hash;
      localStorage.setItem('cyberSecUser', JSON.stringify(newUserCopy));
      return newUserCopy;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('timed out')) {
          throw new Error('Registration is taking too long. Please check your internet connection and try again.');
        }
        if (error.message.includes('fetch')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred during registration. Please try again.');
    }
  }

  async logout() {
    localStorage.removeItem('cyberSecUser');
    localStorage.removeItem('auth_pending_role');
    localStorage.removeItem('auth_pending_role_ts');
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Supabase signOut error:', error);
    }
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('cyberSecUser');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return sanitizeUser(user);
    } catch (e) {
      console.error('Failed to parse user from local storage:', e);
      return null;
    }
  }

  isAdmin() {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  isTeacher() {
    const user = this.getCurrentUser();
    return user?.role === 'teacher';
  }

  isStudent() {
    const user = this.getCurrentUser();
    return user?.role === 'student';
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  async loginWithGoogle(role: 'student' | 'teacher' = 'student'): Promise<void> {
    try {
      localStorage.setItem('auth_pending_role', role);
      localStorage.setItem('auth_pending_role_ts', Date.now().toString());

      const redirectTo = window.location.origin;

      const { error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            }
          }
        }),
        15000,
        'Google OAuth'
      );

      if (error) throw new Error(`Google login failed: ${error.message}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timed out')) {
        throw new Error('Google login is taking too long. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  async handleAuthStateChange(session: any): Promise<User | null> {
    if (!session?.user) return null;

    const user = session.user;

    let profile: any = null;
    let profileError: any = null;

    try {
      // Retry loop to handle race conditions where profile creation might lag behind auth
      let attempts = 0;
      while (attempts < 3) {
        const result = await withTimeout(
          supabase
            .from('users')
            .select('*')
            .eq('email', user.email?.toLowerCase() || '')
            .maybeSingle() as unknown as Promise<any>,
          5000,
          `Profile fetch attempt ${attempts + 1}`
        ) as any;

        if (result.data) {
          profile = result.data;
          profileError = null;
          break;
        }

        if (result.error) {
          profileError = result.error;
          // Don't retry on fatal errors, but maybe retry on connection issues?
          // For now, simple retry logic
        }

        attempts++;
        if (attempts < 3) await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err) {
      profileError = err;
    }

    if (profile) {
      const requestedRole = localStorage.getItem('auth_pending_role');
      const requestedRoleTs = localStorage.getItem('auth_pending_role_ts');
      let isValidRequest = false;
      if (requestedRole && requestedRoleTs) {
        const ts = parseInt(requestedRoleTs, 10);
        if (!isNaN(ts) && (Date.now() - ts < 5 * 60 * 1000)) isValidRequest = true;
      }

      if (isValidRequest && requestedRole && profile.role !== requestedRole) {
        await this.logout();
        await supabase.auth.signOut();
        throw new Error(`Access Denied: You already have a ${profile.role} account.`);
      }

      const userCopy = sanitizeUser(profile as DBUser);
      localStorage.setItem('cyberSecUser', JSON.stringify(userCopy));
      return userCopy;
    }

    if (!profile) {
      const metadata = user.user_metadata || {};
      const pendingRole = localStorage.getItem('auth_pending_role');

      // Fallback: Check if we have a valid cached user in localStorage to preserve role
      const cachedUserStr = localStorage.getItem('cyberSecUser');
      let cachedRole = null;
      if (cachedUserStr) {
        try {
          const cached = JSON.parse(cachedUserStr);
          if (cached && cached.email === user.email) {
            cachedRole = cached.role;
          }
        } catch (e) { /* ignore */ }
      }

      // Priority: Pending Role (Login/Signup) > Metadata Role > Cached Role > 'student'
      const role = pendingRole || metadata.role || cachedRole || 'student';

      console.warn(`Profile not found during sync. Constructing placeholder with role: ${role}`);

      const placeholderUser: any = {
        id: user.id,
        email: user.email,
        name: metadata.full_name || user.email?.split('@')[0] || 'User',
        role: role,
        level: 'beginner',
        created_at: new Date().toISOString()
      };

      if (!profileError) {
        const createProfile = async () => {
          try {
            await supabase
              .from('users')
              .upsert([{
                ...placeholderUser,
                password_hash: 'SUPABASE_AUTH'
              }]);
          } catch (e) {
            // Silently fail
          }
        };
        createProfile();
      }

      localStorage.setItem('cyberSecUser', JSON.stringify(placeholderUser));
      return placeholderUser as User;
    }

    return null;
  }
}

export const authService = new AuthService();