import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function normalizeUrl(url?: string) {
  if (!url) return url;
  const trimmed = url.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

  // If user pasted only project ref, build a full URL
  if (!trimmed.includes('.')) {
    return `https://${trimmed}.supabase.co`;
  }
  return trimmed;
}

const supabaseUrl = normalizeUrl(rawUrl);
const supabaseAnonKey = normalizeUrl(rawKey);

if (typeof window !== 'undefined') {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  }
  if (!/^https:\/\//i.test(supabaseUrl)) {
    throw new Error('Invalid VITE_SUPABASE_URL. It must start with https://');
  }
}

export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string, {
  auth: {
    storageKey: 'cybercoach-admin-auth-token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export async function testSupabaseConnection(): Promise<void> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      // Not fatal here; just surface helpful error
      throw new Error(`Supabase connectivity ok but query failed: ${error.message}`);
    }
  } catch (err: unknown) {
    // Re-throw with clearer guidance for network/CORS/env issues
    const hint = 'Check .env values, network connectivity, and that the project URL is reachable from your browser.';
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Unable to reach Supabase: ${message}. ${hint}`);
  }
}

// Note: removed TypeScript interfaces. Runtime-only module for JS usage.