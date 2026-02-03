import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get lab status
export async function GET(
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

    // Get user from token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: completion } = await supabase
      .from('lab_completions')
      .select('*')
      .eq('student_id', user.id)
      .eq('lab_id', labId.trim())
      .limit(1);

    return NextResponse.json({
      labId,
      completed: completion && completion.length > 0,
      studentId: user.id,
    });
  } catch (error) {
    console.error('Lab status error:', error);
    return NextResponse.json({ error: 'Failed to fetch lab status' }, { status: 500 });
  }
}
