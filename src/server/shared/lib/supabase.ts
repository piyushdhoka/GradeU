import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    const error = new Error(
        'Supabase credentials missing in backend environment. ' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
    logger.error('Supabase Configuration Error', error);
    throw error;
}

if (!supabaseUrl.startsWith('https://')) {
    const error = new Error('Invalid Supabase URL. Must start with https://');
    logger.error('Supabase Configuration Error', error);
    throw error;
}

export const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());

