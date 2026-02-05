import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET experience-based completion validation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const { courseId, moduleId } = await params;

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

    // Create user-scoped client for RLS
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    // Fetch experience from Supabase
    const { data: experience, error } = await userClient
      .from('module_experience')
      .select('time_spent, scroll_depth, interactions')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Experience fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch experience' }, { status: 500 });
    }

    if (!experience) {
      return NextResponse.json({
        timeSpent: 0,
        scrollDepth: 0,
        canComplete: false,
        reason: 'Module not accessed yet',
      });
    }

    const MIN_TIME_SPENT = 60; // Minimum 60 seconds (1 minute)
    const MIN_SCROLL_DEPTH = 50; // Minimum 50% scroll depth

    const timeSpent = experience.time_spent || 0;
    const scrollDepth = experience.scroll_depth || 0;
    const canComplete = timeSpent >= MIN_TIME_SPENT && scrollDepth >= MIN_SCROLL_DEPTH;

    return NextResponse.json({
      timeSpent,
      scrollDepth,
      canComplete,
      minTimeSpent: MIN_TIME_SPENT,
      minScrollDepth: MIN_SCROLL_DEPTH,
      reason: canComplete
        ? 'Engagement requirements met'
        : timeSpent < MIN_TIME_SPENT
          ? `Minimum ${MIN_TIME_SPENT} seconds required (spent ${Math.round(timeSpent)}s)`
          : `Minimum ${MIN_SCROLL_DEPTH}% scroll depth required (reached ${Math.round(scrollDepth)}%)`,
    });
  } catch (error) {
    console.error('Experience validation error:', error);
    return NextResponse.json({ error: 'Failed to fetch experience data' }, { status: 500 });
  }
}
