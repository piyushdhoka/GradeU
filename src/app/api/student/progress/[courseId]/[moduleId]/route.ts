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
    const { moduleId } = await params;

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Fetch progress including quiz_score and completed_topics
    const { data: progress, error } = await userClient
      .from('module_progress')
      .select('id, student_id, module_id, completed, completed_at, quiz_score, completed_topics')
      .eq('student_id', user.id)
      .eq('module_id', moduleId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Module progress GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    if (!progress) {
      return NextResponse.json({
        completed: false,
        completedAt: null,
        quizScore: null,
        completedTopics: [],
      });
    }

    return NextResponse.json({
      completed: progress.completed,
      completedAt: progress.completed_at,
      quizScore: progress.quiz_score,
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
    const { moduleId } = await params;
    const body = await request.json();
    const { completed, quizScore, completedTopics } = body;

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Build update object
    const updates: any = {
      student_id: user.id,
      module_id: moduleId,
      updated_at: new Date().toISOString(),
    };

    if (typeof completed === 'boolean') {
      updates.completed = completed;
      updates.completed_at = completed ? new Date().toISOString() : null;
    }

    if (typeof quizScore === 'number') {
      updates.quiz_score = quizScore;
    }

    if (Array.isArray(completedTopics)) {
      updates.completed_topics = completedTopics
        .filter((topic: unknown) => typeof topic === 'string')
        .map((topic: string) => topic.trim())
        .filter((topic: string) => topic.length > 0);
    }

    // Upsert progress
    const { error } = await userClient.from('module_progress').upsert(
      updates,
      { onConflict: 'student_id,module_id' }
    );

    if (error) {
      console.error('Module progress PUT error:', error);
      return NextResponse.json({ error: 'Failed to update progress', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Progress updated successfully' });
  } catch (error) {
    console.error('Module progress PUT error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
