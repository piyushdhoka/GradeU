import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET progress for all modules in a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

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

    // Detect if courseId is a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId);
    const column = isUUID ? 'id' : 'slug';

    // First lookup course to get actual UUID
    const { data: course, error: courseError } = await userClient
      .from('courses')
      .select('id')
      .eq(column, courseId)
      .single();

    if (courseError || !course) {
      console.error('Course lookup error:', courseError);
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get module IDs for this course using actual UUID
    const { data: modules, error: modulesError } = await userClient
      .from('modules')
      .select('id')
      .eq('course_id', course.id);

    if (modulesError) {
      console.error('Modules fetch error:', modulesError);
      return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 });
    }

    const moduleIds = (modules || []).map((m: any) => m.id);

    if (moduleIds.length === 0) {
      return NextResponse.json({});
    }

    // Fetch progress including quiz_score and completed_topics
    const { data: progress, error } = await userClient
      .from('module_progress')
      .select('module_id, completed, completed_at, quiz_score, completed_topics')
      .eq('student_id', user.id)
      .in('module_id', moduleIds);

    if (error) {
      console.error('Course progress error:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    // Convert to map with fields frontend expects
    const progressMap: Record<string, any> = {};
    (progress || []).forEach((p: any) => {
      progressMap[p.module_id] = {
        completed: p.completed,
        completedAt: p.completed_at,
        quizScore: p.quiz_score,
        completedTopics: p.completed_topics || [],
      };
    });

    return NextResponse.json(progressMap);
  } catch (error) {
    console.error('Course progress error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
