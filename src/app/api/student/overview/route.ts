import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import connectDB from '@/lib/mongodb';
import { StudentExperience } from '@/lib/models/StudentExperience';
import { StudentProgress } from '@/lib/models/StudentProgress';
import { Course } from '@/lib/models/Course';

// Use anon key for auth verification
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Use service role key for database operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentEmail = user.email || '';

    await connectDB();

    // Run all independent queries in parallel
    const [experiences, mongoProgress, labCompletionsResult] = await Promise.all([
      // Get study time from MongoDB
      StudentExperience.find({ 
        $or: [{ studentId: user.id }, { studentEmail: studentEmail }]
      }).lean(),
      
      // Get progress from MongoDB
      StudentProgress.find({ 
        $or: [{ studentId: user.id }, { studentEmail: studentEmail }]
      }).sort({ updatedAt: -1 }).lean(),
      
      // Get lab completions from Supabase (use admin to bypass RLS)
      supabaseAdmin
        .from('lab_completions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
    ]);

    const completedLabs = labCompletionsResult.count || 0;

    // Calculate study time
    const totalSeconds = experiences.reduce((acc: number, exp: any) => acc + (exp.totalTimeSpent || 0), 0);
    const totalStudyTime = totalSeconds < 3600
      ? `${Math.floor(totalSeconds / 60)} mins`
      : `${(totalSeconds / 3600).toFixed(1)} hours`;

    // Get unique course IDs and fetch all courses in ONE query
    const courseIds = [...new Set((mongoProgress as any[]).map(p => p.courseId))];
    const courses = courseIds.length > 0 
      ? await Course.find({ _id: { $in: courseIds } }).select('title modules description').lean()
      : [];
    
    // Build course lookup map
    const courseMap = new Map<string, any>();
    for (const course of courses) {
      courseMap.set((course as any)._id.toString(), course);
    }

    // Calculate progress per course
    const courseProgressMap = new Map<string, { completed: number; total: number }>();
    const completedCourseIds = new Set<string>();

    for (const p of mongoProgress as any[]) {
      const course = courseMap.get(p.courseId);
      if (!course) continue;

      if (!courseProgressMap.has(p.courseId)) {
        courseProgressMap.set(p.courseId, {
          completed: 0,
          total: (course as any).modules?.length || 0,
        });
      }
      
      const courseData = courseProgressMap.get(p.courseId)!;
      if (p.completed) {
        courseData.completed += 1;
        if (courseData.completed >= courseData.total && courseData.total > 0) {
          completedCourseIds.add(p.courseId);
        }
      }
    }

    // Find active course (most recent incomplete) - no extra queries needed
    let activeCourse = null;
    for (const [courseId, data] of courseProgressMap.entries()) {
      if (data.completed < data.total && data.total > 0) {
        const course = courseMap.get(courseId);
        if (course) {
          const completedModuleIds = (mongoProgress as any[])
            .filter((p: any) => p.courseId === courseId && p.completed)
            .map((p: any) => p.moduleId);
          
          const nextModule = (course as any).modules?.find((m: any) => 
            !completedModuleIds.includes(m._id?.toString())
          );
          
          const progress = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

          activeCourse = {
            courseId: courseId,
            title: (course as any).title,
            description: (course as any).description || '',
            currentModuleId: nextModule?._id?.toString() || '',
            currentModuleTitle: nextModule?.title || 'Next Module',
            progress: progress,
          };
          break;
        }
      }
    }

    // Build activities - no extra queries, use courseMap
    const activities = (mongoProgress as any[]).slice(0, 5).map((p: any) => {
      const course = courseMap.get(p.courseId);
      const moduleTitle = (course as any)?.modules?.find((m: any) => 
        m._id?.toString() === p.moduleId
      )?.title || 'Module';
      
      return {
        id: p._id?.toString(),
        type: p.completed ? 'completion' : 'start',
        action: `${p.completed ? 'Completed' : 'Started'} ${moduleTitle}`,
        course: (course as any)?.title || 'Course',
        timestamp: p.updatedAt,
        courseId: p.courseId,
        moduleId: p.moduleId,
      };
    });

    return NextResponse.json({
      stats: {
        completedCourses: completedCourseIds.size,
        completedModules: mongoProgress.filter((p: any) => p.completed).length,
        completedLabs: completedLabs || 0,
        totalStudyTime,
        activeCourse,
        activities,
      }
    });
  } catch (error) {
    console.error('Overview API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview' },
      { status: 500 }
    );
  }
}
