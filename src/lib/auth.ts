import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const STAFF_ROLES = ['teacher', 'admin']

// Returns the signed-in user when they are an active teacher or admin, otherwise null.
// Every API route and server action must check this before touching supabaseAdmin,
// because supabaseAdmin bypasses all RLS.
export async function getStaffUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, is_active, full_name')
        .eq('id', user.id)
        .maybeSingle()

    if (!profile || !STAFF_ROLES.includes(profile.role) || profile.is_active === false) {
        return null
    }

    return { user, profile }
}
