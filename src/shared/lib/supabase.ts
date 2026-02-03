import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function normalizeUrl(url?: string) {
  if (!url) return url;
  const trimmed = url.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // If user pasted only project ref, build a full URL
  if (/^[a-z0-9]{20}$/i.test(trimmed)) return `https://${trimmed}.supabase.co`;
  return trimmed;
}

const supabaseUrl = normalizeUrl(rawUrl) || '';
const supabaseAnonKey = rawKey?.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '') || '';

// Only validate on client side to avoid build errors
export function assertSupabaseEnv() {
  if (typeof window === 'undefined') return; // Skip on server
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env'
    );
  }
}

// Create Supabase client - works on both server and client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'implicit', // Use implicit flow - tokens come in URL hash
  },
});

// Call assertion on client side only
if (typeof window !== 'undefined') {
  assertSupabaseEnv();
}

export async function testSupabaseConnection(): Promise<void> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      // Not fatal here; just surface helpful error
      throw new Error(`Supabase connectivity ok but query failed: ${error.message}`);
    }
  } catch (err: unknown) {
    // Re-throw with clearer guidance for network/CORS/env issues
    const hint =
      'Check .env values, network connectivity, and that the project URL is reachable from your browser.';
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Unable to reach Supabase: ${message}. ${hint}`);
  }
}

// Note: removed TypeScript interfaces. Runtime-only module for JS usage.
