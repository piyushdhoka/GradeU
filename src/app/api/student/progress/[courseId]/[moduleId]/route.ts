import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET module progress
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

    // Fetch progress from Supabase
    const { data: progress, error } = await supabase
      .from('module_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (which is fine)
      console.error('Module progress GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    if (!progress) {
      return NextResponse.json({
        completed: false,
        quizScore: null,
        completedAt: null,
        completedTopics: [],
      });
    }

    return NextResponse.json({
      completed: progress.completed,
      quizScore: progress.quiz_score,
      completedAt: progress.completed_at,
      completedTopics: progress.completed_topics || [],
    });
  } catch (error) {
    console.error('Module progress GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// UPDATE module progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const { courseId, moduleId } = await params;
    const body = await request.json();
    const { completed, quizScore, completedTopics } = body;

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

    if (typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'completed must be a boolean' }, { status: 400 });
    }

    // Upsert progress in Supabase
    const { error } = await supabase.from('module_progress').upsert(
      {
        student_id: user.id,
        course_id: courseId,
        module_id: moduleId,
        completed,
        quiz_score: quizScore || null,
        completed_topics: completedTopics || [],
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'student_id,course_id,module_id',
      }
    );

    if (error) {
      console.error('Module progress PUT error:', error);
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Progress updated successfully' });
  } catch (error) {
    console.error('Module progress PUT error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
