import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET progress for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

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

    // Fetch all module progress for this course from Supabase
    const { data: progress, error } = await supabase
      .from('module_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('course_id', courseId);

    if (error) {
      console.error('Course progress error:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    // Convert to a map of moduleId -> progress
    const progressMap: Record<string, any> = {};
    (progress || []).forEach((p: any) => {
      progressMap[p.module_id] = {
        completed: p.completed,
        quizScore: p.quiz_score,
        completedAt: p.completed_at,
        completedTopics: p.completed_topics || [],
      };
    });

    return NextResponse.json(progressMap);
  } catch (error) {
    console.error('Course progress error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
