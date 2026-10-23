// Privileged admin actions that need the service-role key.
// The key is provided to Edge Functions by Supabase as SUPABASE_SERVICE_ROLE_KEY
// and never leaves the server. Every request must come from an active admin.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Verify the caller is a signed-in, active admin
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Not signed in' }, 401);

  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) return json({ error: 'Not signed in' }, 401);

  const { data: caller } = await admin
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (caller?.role !== 'admin' || caller.is_active === false) {
    return json({ error: 'Admin access required' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  switch (body.action) {
    case 'create-teacher':
      return createTeacher(admin, body);
    case 'delete-user':
      return deleteUser(admin, user.id, body);
    default:
      return json({ error: 'Unknown action' }, 400);
  }
});

async function createTeacher(admin: SupabaseClient, body: Record<string, unknown>) {
  const { email, password, name, specialization, bio } = body;

  if (typeof email !== 'string' || !email.includes('@')) {
    return json({ error: 'A valid email is required' }, 400);
  }
  if (typeof password !== 'string' || password.length < 6) {
    return json({ error: 'Password must be at least 6 characters long' }, 400);
  }
  const fullName = typeof name === 'string' ? name : '';

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'teacher' },
  });
  if (error || !data.user) {
    return json({ error: `Failed to create teacher account: ${error?.message ?? 'No user returned'}` }, 400);
  }

  const id = data.user.id;

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ id, full_name: fullName, role: 'teacher' });

  const { error: detailsError } = profileError
    ? { error: null }
    : await admin.from('teacher_details').upsert({
        id,
        teacher_name: fullName,
        specialization: typeof specialization === 'string' ? specialization : null,
        bio: typeof bio === 'string' ? bio : null,
      });

  // Roll back so a half-created teacher doesn't linger
  const setupError = profileError ?? detailsError;
  if (setupError) {
    await admin.from('profiles').delete().eq('id', id);
    await admin.auth.admin.deleteUser(id);
    return json({ error: `Failed to set up teacher profile: ${setupError.message}` }, 500);
  }

  return json({ user: { id, email } });
}

async function deleteUser(admin: SupabaseClient, callerId: string, body: Record<string, unknown>) {
  const { userId } = body;

  if (typeof userId !== 'string' || !userId) {
    return json({ error: 'userId is required' }, 400);
  }
  if (userId === callerId) {
    return json({ error: "You can't delete your own account" }, 400);
  }

  await admin.from('teacher_details').delete().eq('id', userId);

  const { error: profileError } = await admin.from('profiles').delete().eq('id', userId);
  if (profileError) {
    return json({ error: `Failed to delete user: ${profileError.message}` }, 400);
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    return json({ error: `Profile removed but the login account could not be deleted: ${authError.message}` }, 500);
  }

  return json({ success: true });
}
