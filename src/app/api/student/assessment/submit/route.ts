import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Submit assessment
export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, moduleId, quizId, answers, score } = body;

    if (!courseId || !moduleId) {
      return NextResponse.json({ error: 'Missing courseId or moduleId' }, { status: 400 });
    }

    // Store assessment result in module_progress
    const { error } = await supabase
      .from('module_progress')
      .upsert({
        student_id: user.id,
        course_id: courseId,
        module_id: moduleId,
        quiz_score: score,
        completed: score >= 70, // Auto-complete if score >= 70%
        completed_at: score >= 70 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'student_id,course_id,module_id'
      });

    if (error) {
      console.error('Assessment submit error:', error);
      return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      score,
      passed: score >= 70,
      message: score >= 70 ? 'Congratulations! You passed!' : 'Keep practicing!',
    });
  } catch (error) {
    console.error('Assessment submit error:', error);
    return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
  }
}
