import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use anon key for user verification
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialized within the handler using the user's token
function getSupabaseUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
}

// Mark lab as completed (alternative endpoint)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ labId: string }> }
) {
  try {
    const { labId } = await params;

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token (verify auth)
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userClient = getSupabaseUserClient(token);

    // Check if already completed (use user client)
    const { data: existing } = await userClient
      .from('lab_completions')
      .select('*')
      .eq('student_id', user.id)
      .eq('lab_id', labId.trim())
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Lab already completed',
        completion: existing[0],
      });
    }

    // Insert new completion (use user client to respect RLS)
    const { data: completion, error } = await userClient
      .from('lab_completions')
      .insert({
        student_id: user.id,
        lab_id: labId.trim(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error marking lab complete:', error);
      return NextResponse.json({ error: 'Failed to mark lab as completed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Lab ${labId} marked as completed`,
      completion,
    });
  } catch (error) {
    console.error('Lab completion error:', error);
    return NextResponse.json({ error: 'Failed to mark lab as completed' }, { status: 500 });
  }
}
