import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Submit assessment/quiz
export async function POST(request: NextRequest) {
  try {
    console.log('[assessment/submit] Submitting assessment...');

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

    const body = await request.json();
    const { moduleId, answers, score, proctoringSessionId } = body;

    if (!moduleId) {
      return NextResponse.json({ error: 'Missing moduleId' }, { status: 400 });
    }

    let resolvedScore: number | null = typeof score === 'number' ? score : null;

    // Backward-compatible fallback: derive score if old clients don't send it
    if (resolvedScore === null && answers && typeof answers === 'object' && !Array.isArray(answers)) {
      const { data: quizRows, error: quizFetchError } = await supabase
        .from('quizzes')
        .select('id, correct_option')
        .eq('module_id', moduleId);

      if (quizFetchError) {
        console.error('[assessment/submit] Failed to fetch quiz answers:', quizFetchError);
      } else if (quizRows && quizRows.length > 0) {
        const correct = quizRows.reduce((acc, q) => {
          const userAnswer = (answers as Record<string, unknown>)[q.id];
          return Number(userAnswer) === Number(q.correct_option) ? acc + 1 : acc;
        }, 0);
        resolvedScore = Math.round((correct / quizRows.length) * 100);
      }
    }

    if (resolvedScore === null || Number.isNaN(resolvedScore)) {
      return NextResponse.json({ error: 'Missing score' }, { status: 400 });
    }

    console.log(
      `[assessment/submit] User: ${user.id}, Module: ${moduleId}, Score: ${resolvedScore}`
    );

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Fetch module type to check if it's an initial assessment
    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .select('type')
      .eq('id', moduleId)
      .single();

    if (moduleError) {
      console.error('[assessment/submit] Failed to fetch module type:', moduleError);
    }

    const isInitialAssessment = moduleData?.type === 'initial_assessment';
    const isPass = resolvedScore >= 70;
    const shouldComplete = isPass || isInitialAssessment;

    // Store assessment result in module_progress
    const { error: progressError } = await userClient.from('module_progress').upsert(
      {
        student_id: user.id,
        module_id: moduleId,
        quiz_score: resolvedScore,
        completed: shouldComplete,
        completed_at: shouldComplete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'student_id,module_id',
      }
    );

    if (progressError) {
      console.error('[assessment/submit] Progress upsert error:', progressError);
      return NextResponse.json(
        { error: 'Failed to update progress', details: progressError.message },
        { status: 500 }
      );
    }

    // Also store in quiz_attempts for history
    const { error: attemptError } = await userClient.from('quiz_attempts').insert({
      student_id: user.id,
      module_id: moduleId,
      score: resolvedScore,
      passed: resolvedScore >= 70,
      answers: answers || {},
      proctoring_session_id: proctoringSessionId || null,
      completed_at: new Date().toISOString(),
    });

    if (attemptError) {
      console.error('[assessment/submit] Quiz attempt insert error (non-fatal):', attemptError);
      // We don't fail the whole request if history fails
    }

    console.log(`[assessment/submit] Saved. Passed: ${resolvedScore >= 70}`);

    return NextResponse.json({
      success: true,
      score: resolvedScore,
      passed: isPass,
      completed: shouldComplete,
      message: shouldComplete ? 'Assessment complete! You can now proceed.' : 'Keep practicing!',
    });
  } catch (error) {
    console.error('[assessment/submit] Error:', error);
    return NextResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
  }
}
