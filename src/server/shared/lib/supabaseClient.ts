import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials missing in environment.');
}

/**
 * Creates a Supabase client authorized with a specific user's JWT.
 * Use this in backend services to perform operations that should respect RLS.
 */
export const getAuthorizedClient = (accessToken: string): SupabaseClient => {
    return createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
};
