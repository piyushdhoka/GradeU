import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { slugify } from '@shared/utils/slug';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COURSE_LIST_CACHE_CONTROL = 'public, max-age=0, s-maxage=60, must-revalidate';

function buildEtag(payload: unknown): string {
  const hash = createHash('sha1').update(JSON.stringify(payload)).digest('hex');
  return `"${hash}"`;
}

function buildCacheHeaders(etag: string): HeadersInit {
  return {
    'Cache-Control': COURSE_LIST_CACHE_CONTROL,
    ETag: etag,
  };
}

// -----------------------------------------------------------------------------
// SERVER-SIDE CACHING (Long-term Scalability)
// -----------------------------------------------------------------------------
let COURSE_LIST_CACHE: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Get all published courses with their modules
export async function GET(request: NextRequest) {
  try {
    // 1) Check Cache
    if (COURSE_LIST_CACHE && Date.now() - COURSE_LIST_CACHE.timestamp < CACHE_TTL) {
      console.log('[courses/route] Serving course list from cache');
      const etag = buildEtag(COURSE_LIST_CACHE.data);
      const headers = buildCacheHeaders(etag);
      const ifNoneMatch = request.headers.get('if-none-match');
      if (ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304, headers });
      }
      return NextResponse.json(COURSE_LIST_CACHE.data, { headers });
    }

    console.log('[courses/route] Fetching courses from DB...');

    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(
        'id, slug, title, description, is_published, certificate_enabled, created_at, category, estimated_hours'
      )
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (coursesError) {
      console.error('[courses/route] Courses query error:', coursesError);
      return NextResponse.json(
        { error: 'Failed to fetch courses', details: coursesError.message },
        { status: 500 }
      );
    }

    if (!courses || courses.length === 0) {
      const emptyResponse: unknown[] = [];
      const etag = buildEtag(emptyResponse);
      const headers = buildCacheHeaders(etag);
      return NextResponse.json(emptyResponse, { headers });
    }

    const courseIds = courses.map((course) => course.id);

    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, course_id, title, module_order')
      .in('course_id', courseIds)
      .order('module_order', { ascending: true });

    if (modulesError) {
      console.error('[courses/route] Modules query error:', modulesError);
    }

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

    const normalizedCourses = courses.map((course: any) => {
      const courseModules = modulesByCourse.get(course.id) || [];

      return {
        id: course.id,
        // Use stored slug, or generate from title if missing
        slug: course.slug || slugify(course.title),
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

    // 2) Update Cache
    COURSE_LIST_CACHE = { data: normalizedCourses, timestamp: Date.now() };

    const etag = buildEtag(normalizedCourses);
    const headers = buildCacheHeaders(etag);
    const ifNoneMatch = request.headers.get('if-none-match');

    if (ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304, headers });
    }

    return NextResponse.json(normalizedCourses, { headers });
  } catch (error) {
    console.error('[courses/route] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
