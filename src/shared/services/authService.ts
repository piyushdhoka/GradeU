import { supabase } from '@lib/supabase';
import type { User } from '@types';

type DBUser = {
  id: string;
  full_name?: string | null;
  role?: string;
  created_at?: string;
  is_active?: boolean;
  phone_number?: string;
  faculty?: string;
  department?: string;
  contact_email?: string;
  email_type?: 'vu' | 'personal';
  onboarding_completed?: boolean;
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



function resolveName(metadata: any, email?: string): string {
  // Priority order for finding a name in OAuth metadata
  const name =
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    metadata.given_name ||
    (metadata.first_name ? `${metadata.first_name} ${metadata.last_name || ''}`.trim() : null) ||
    email?.split('@')[0] ||
    'User';

  return name;
}

function sanitizeUser(dbUser: DBUser, email?: string): User {
  return {
    id: dbUser.id,
    name: dbUser.full_name || email?.split('@')[0] || 'User',
    email: email || '',
    role: dbUser.role as 'student' | 'admin' | 'teacher',
    created_at: dbUser.created_at,
    avatar_url: (dbUser as any).avatar_url,
    phone_number: dbUser.phone_number,
    faculty: dbUser.faculty,
    department: dbUser.department,
    contact_email: dbUser.contact_email,
    email_type: dbUser.email_type,
    onboarding_completed: dbUser.onboarding_completed || false,
  };
}

class AuthService {




  async logout() {
    localStorage.removeItem('gradeUUser');
    localStorage.removeItem('auth_pending_role');
    localStorage.removeItem('auth_pending_role_ts');
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Supabase signOut error:', error);
    }
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('gradeUUser');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return sanitizeUser(user);
    } catch (e) {
      console.error('Failed to parse user from local storage:', e);
      return null;
    }
  }



  isStudent() {
    const user = this.getCurrentUser();
    return user?.role === 'student';
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  async loginWithGoogle(role: 'student' = 'student'): Promise<void> {
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
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .limit(1) as unknown as Promise<any>,
          5000,
          `Profile fetch attempt ${attempts + 1}`
        ) as any;

        if (result.data && result.data.length > 0) {
          profile = result.data[0];
          // console.log('[AuthService] Fetched profile:', profile);
          profileError = null;
          break;
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

      // If existing profile has the default "User" name, try to improve it with metadata
      const metadata = user.user_metadata || {};
      const actualName = resolveName(metadata, user.email);

      if (profile.full_name === 'User' || !profile.full_name || profile.full_name === user.email?.split('@')[0]) {
        if (actualName && actualName !== 'User' && actualName !== profile.full_name) {
          try {
            await supabase
              .from('profiles')
              .update({ full_name: actualName })
              .eq('id', user.id);
            profile.full_name = actualName; // Update local reference
          } catch (e) {
            console.warn('Failed to auto-update profile name:', e);
          }
        }
      }

      const userCopy = sanitizeUser(profile as DBUser, user.email);
      localStorage.setItem('gradeUUser', JSON.stringify(userCopy));
      return userCopy;
    }

    if (!profile) {
      const metadata = user.user_metadata || {};
      const pendingRole = localStorage.getItem('auth_pending_role');

      // Fallback: Check if we have a valid cached user in localStorage to preserve role
      const cachedUserStr = localStorage.getItem('gradeUUser');
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

      const resolvedName = resolveName(metadata, user.email);

      const placeholderUser: any = {
        id: user.id,
        email: user.email,
        name: resolvedName,
        role: role,
        level: 'beginner',
        avatar_url: metadata.avatar_url || metadata.picture,
        created_at: new Date().toISOString()
      };

      if (!profileError) {
        const createProfile = async () => {
          try {
            await supabase
              .from('profiles')
              .upsert([{
                id: user.id,
                full_name: placeholderUser.name,
                role: role,
              }]);
          } catch (e) {
            // Silently fail
          }
        };
        createProfile();
      }

      localStorage.setItem('gradeUUser', JSON.stringify(placeholderUser));
      return placeholderUser as User;
    }

    return null;
  }
}

export const authService = new AuthService();