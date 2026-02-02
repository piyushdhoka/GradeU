import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function normalizeUrl(url?: string) {
  if (!url) return url;
  const trimmed = url.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // If user pasted only project ref, build a full URL
  if (/^[a-z0-9]{20}$/i.test(trimmed)) return `https://${trimmed}.supabase.co`;
  return trimmed;
}

const supabaseUrl = normalizeUrl(rawUrl);
const supabaseAnonKey = rawKey?.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

export function assertSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env');
  }
  if (!/^https:\/\//i.test(supabaseUrl)) {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL. It must start with https://');
  }
}

assertSupabaseEnv();

export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

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