import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { labs } from '@data/labs';

// Use anon key for auth verification
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

export async function GET(request: NextRequest) {
  try {
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
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userClient = getSupabaseUserClient(token);

    // Run all independent queries in parallel
    const [
      experienceResult,
      progressResult,
      labCompletionsResult,
      certificatesResult,
      coursesResult,
    ] = await Promise.all([
      // Get experience from Supabase (for study time)
      userClient
        .from('module_experience')
        .select('course_id, module_id, time_spent, scroll_depth, updated_at')
        .eq('student_id', user.id),

      // Get progress from Supabase
      userClient
        .from('module_progress')
        .select('*')
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false }),

      // Get lab completions from Supabase
      userClient.from('lab_completions').select('lab_id'),

      // Get certificates count from Supabase
      userClient
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id),

      // Get courses from Supabase
      userClient.from('courses').select('id, title, description'),
    ]);

    const experiences = experienceResult.data || [];
    const progress = progressResult.data || [];
    const completedLabs = labCompletionsResult.data?.length || 0;
    const completedLabIds = labCompletionsResult.data?.map((l: any) => l.lab_id) || [];
    const certificatesEarned = certificatesResult.count || 0;
    const courses = coursesResult.data || [];

    // Calculate study time from experience
    const totalSeconds = experiences.reduce(
      (acc: number, exp: any) => acc + (exp.time_spent || 0),
      0
    );
    const totalStudyTime =
      totalSeconds < 3600
        ? `${Math.floor(totalSeconds / 60)} mins`
        : `${(totalSeconds / 3600).toFixed(1)} hours`;

    // Build course lookup map
    const courseMap = new Map<string, any>();
    for (const course of courses) {
      courseMap.set(course.id, course);
    }

    // Get unique course IDs from progress
    const courseIds = [...new Set(progress.map((p: any) => p.course_id))];

    // Fetch modules for these courses
    const { data: modules } = await userClient
      .from('modules')
      .select('id, course_id, title, order_index')
      .in('course_id', courseIds.length > 0 ? courseIds : ['none']);

    // Build module lookup by course
    const modulesByCourse = new Map<string, any[]>();
    for (const mod of modules || []) {
      if (!modulesByCourse.has(mod.course_id)) {
        modulesByCourse.set(mod.course_id, []);
      }
      modulesByCourse.get(mod.course_id)!.push(mod);
    }

    // Sort modules by order_index
    for (const [, mods] of modulesByCourse) {
      mods.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
    }

    // Calculate progress per course
    const courseProgressMap = new Map<string, { completed: number; total: number }>();
    const completedCourseIds = new Set<string>();

    for (const p of progress) {
      const courseMods = modulesByCourse.get(p.course_id) || [];

      if (!courseProgressMap.has(p.course_id)) {
        courseProgressMap.set(p.course_id, {
          completed: 0,
          total: courseMods.length,
        });
      }

      const courseData = courseProgressMap.get(p.course_id)!;
      if (p.completed) {
        courseData.completed += 1;
        if (courseData.completed >= courseData.total && courseData.total > 0) {
          completedCourseIds.add(p.course_id);
        }
      }
    }

    // Find active course (most recent incomplete)
    let activeCourse = null;
    for (const [courseId, data] of courseProgressMap.entries()) {
      if (data.completed < data.total && data.total > 0) {
        const course = courseMap.get(courseId);
        const courseMods = modulesByCourse.get(courseId) || [];

        if (course) {
          const completedModuleIds = progress
            .filter((p: any) => p.course_id === courseId && p.completed)
            .map((p: any) => p.module_id);

          const nextModule = courseMods.find(
            (m: any) => !completedModuleIds.includes(m.id)
          );

          const progressPct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

          activeCourse = {
            courseId: courseId,
            title: course.title,
            description: course.description || '',
            currentModuleId: nextModule?.id || '',
            currentModuleTitle: nextModule?.title || 'Next Module',
            progress: progressPct,
          };
          break;
        }
      }
    }

    // Build activities from progress
    const activities = progress.slice(0, 5).map((p: any) => {
      const course = courseMap.get(p.course_id);
      const courseMods = modulesByCourse.get(p.course_id) || [];
      const moduleTitle = courseMods.find((m: any) => m.id === p.module_id)?.title || 'Module';

      return {
        id: `${p.student_id}-${p.course_id}-${p.module_id}`,
        type: p.completed ? 'completion' : 'start',
        action: `${p.completed ? 'Completed' : 'Started'} ${moduleTitle}`,
        course: course?.title || 'Course',
        timestamp: p.updated_at,
        courseId: p.course_id,
        moduleId: p.module_id,
      };
    });

    return NextResponse.json({
      stats: {
        completedCourses: completedCourseIds.size,
        completedModules: progress.filter((p: any) => p.completed).length,
        completedLabs: completedLabs || 0,
        certificatesEarned,
        totalStudyTime,
        activeCourse,
        activities,
      },
      labStats: {
        totalLabs: labs.length,
        completedLabs: completedLabs,
        completionPercentage: Math.round((completedLabs / labs.length) * 100),
        completedLabIds: completedLabIds,
      },
    });
  } catch (error) {
    console.error('Overview API error:', error);
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 });
  }
}
