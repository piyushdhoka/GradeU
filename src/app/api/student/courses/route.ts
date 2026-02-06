import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Get all published courses with their modules
export async function GET(request: NextRequest) {
  try {
    console.log('📚 [courses/route] Fetching courses...');

    // Step 1: Fetch courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, description, is_published, certificate_enabled, created_at, category, estimated_hours')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (coursesError) {
      console.error('❌ [courses/route] Courses query error:', coursesError);
      return NextResponse.json({ error: 'Failed to fetch courses', details: coursesError.message }, { status: 500 });
    }

    console.log(`✅ [courses/route] Found ${courses?.length || 0} courses`);

    if (!courses || courses.length === 0) {
      return NextResponse.json([]);
    }

    // Step 2: Fetch modules for all courses
    const courseIds = courses.map(c => c.id);
    console.log('📦 [courses/route] Fetching modules for course IDs:', courseIds);

    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, course_id, title, module_order')
      .in('course_id', courseIds)
      .order('module_order', { ascending: true });

    if (modulesError) {
      console.error('❌ [courses/route] Modules query error:', modulesError);
      // Return courses without modules rather than failing completely
    }

    console.log(`✅ [courses/route] Found ${modules?.length || 0} total modules`);

    // Group modules by course_id
    const modulesByCourse = new Map<string, any[]>();
    for (const mod of modules || []) {
      if (!modulesByCourse.has(mod.course_id)) {
        modulesByCourse.set(mod.course_id, []);
      }
      modulesByCourse.get(mod.course_id)!.push({
        id: mod.id,
        title: mod.title,
      });
    }

    // Step 3: Build response
    const normalizedCourses = courses.map((course: any) => {
      const courseModules = modulesByCourse.get(course.id) || [];
      console.log(`📖 [courses/route] Course "${course.title}" has ${courseModules.length} modules`);

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        certificate_enabled: course.certificate_enabled,
        category: course.category,
        estimated_hours: course.estimated_hours,
        module_count: courseModules.length,
        modules: courseModules,
        createdAt: course.created_at,
      };
    });

    console.log('✅ [courses/route] Returning', normalizedCourses.length, 'courses');
    return NextResponse.json(normalizedCourses);
  } catch (error) {
    console.error('💥 [courses/route] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
