import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { labs } from '@data/labs';

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getSupabaseUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userClient = getSupabaseUserClient(token);

    // Parallel queries - only query columns that exist
    const [
      experienceResult,
      progressResult,
      labCompletionsResult,
      certificatesResult,
      coursesResult,
    ] = await Promise.all([
      userClient
        .from('module_experience')
        .select('module_id, time_spent')
        .eq('student_id', user.id),

      userClient
        .from('module_progress')
        .select('module_id, completed, completed_at')
        .eq('student_id', user.id)
        .order('completed_at', { ascending: false, nullsFirst: false }),

      userClient.from('lab_completions').select('lab_id'),

      userClient
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id),

      userClient.from('courses').select('id, title, description'),
    ]);

    const experiences = experienceResult.data || [];
    const progress = progressResult.data || [];
    const completedLabs = labCompletionsResult.data?.length || 0;
    const completedLabIds = labCompletionsResult.data?.map((l: any) => l.lab_id) || [];
    const certificatesEarned = certificatesResult.count || 0;
    const courses = coursesResult.data || [];

    // Calculate study time
    const totalSeconds = experiences.reduce(
      (acc: number, exp: any) => acc + (exp.time_spent || 0),
      0
    );
    const totalStudyTime =
      totalSeconds < 3600
        ? `${Math.floor(totalSeconds / 60)} mins`
        : `${(totalSeconds / 3600).toFixed(1)} hours`;

    // Build lookups
    const courseMap = new Map<string, any>();
    for (const course of courses) {
      courseMap.set(course.id, course);
    }

    // Get all modules
    const { data: allModules } = await userClient
      .from('modules')
      .select('id, course_id, title, module_order');

    const moduleMap = new Map<string, any>();
    const modulesByCourse = new Map<string, any[]>();
    for (const mod of allModules || []) {
      moduleMap.set(mod.id, mod);
      if (!modulesByCourse.has(mod.course_id)) {
        modulesByCourse.set(mod.course_id, []);
      }
      modulesByCourse.get(mod.course_id)!.push(mod);
    }

    // Sort modules
    for (const [, mods] of modulesByCourse) {
      mods.sort((a: any, b: any) => (a.module_order || 0) - (b.module_order || 0));
    }

    // Calculate progress per course
    const courseProgressMap = new Map<string, { completed: number; total: number }>();
    const completedCourseIds = new Set<string>();

    for (const p of progress) {
      const mod = moduleMap.get(p.module_id);
      if (!mod) continue;

      const courseId = mod.course_id;
      const courseMods = modulesByCourse.get(courseId) || [];

      if (!courseProgressMap.has(courseId)) {
        courseProgressMap.set(courseId, { completed: 0, total: courseMods.length });
      }

      const courseData = courseProgressMap.get(courseId)!;
      if (p.completed) {
        courseData.completed += 1;
        if (courseData.completed >= courseData.total && courseData.total > 0) {
          completedCourseIds.add(courseId);
        }
      }
    }

    // Find active course
    let activeCourse = null;
    for (const [courseId, data] of courseProgressMap.entries()) {
      if (data.completed < data.total && data.total > 0) {
        const course = courseMap.get(courseId);
        const courseMods = modulesByCourse.get(courseId) || [];

        if (course) {
          const completedModuleIds = progress
            .filter((p: any) => moduleMap.get(p.module_id)?.course_id === courseId && p.completed)
            .map((p: any) => p.module_id);

          const nextModule = courseMods.find((m: any) => !completedModuleIds.includes(m.id));
          const progressPct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

          activeCourse = {
            courseId,
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

    // Build activities
    const activities = progress.slice(0, 5).map((p: any) => {
      const mod = moduleMap.get(p.module_id);
      const course = mod ? courseMap.get(mod.course_id) : null;

      return {
        id: `${user.id}-${p.module_id}`,
        type: p.completed ? 'completion' : 'start',
        action: `${p.completed ? 'Completed' : 'Started'} ${mod?.title || 'Module'}`,
        course: course?.title || 'Course',
        timestamp: p.completed_at,
        courseId: mod?.course_id,
        moduleId: p.module_id,
      };
    });

    return NextResponse.json({
      stats: {
        completedCourses: completedCourseIds.size,
        completedModules: progress.filter((p: any) => p.completed).length,
        completedLabs,
        certificatesEarned,
        totalStudyTime,
        activeCourse,
        activities,
      },
      labStats: {
        totalLabs: labs.length,
        completedLabs,
        completionPercentage: Math.round((completedLabs / labs.length) * 100),
        completedLabIds,
      },
    });
  } catch (error) {
    console.error('Overview API error:', error);
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 });
  }
}
