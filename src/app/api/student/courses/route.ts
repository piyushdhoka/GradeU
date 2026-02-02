import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import connectDB from '@/lib/mongodb';
import { Course } from '@/lib/models/Course';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Try MongoDB first
    await connectDB();
    
    // Only select fields needed for listing (not full content)
    const courses = await Course.find({ published: true })
      .select('title description code difficulty duration modules._id modules.title modules.type createdAt')
      .lean();

    if (courses && courses.length > 0) {
      // Normalize MongoDB courses
      const normalizedCourses = courses.map((course: any) => ({
        id: course._id?.toString(),
        title: course.title,
        description: course.description,
        code: course.code,
        difficulty: course.difficulty,
        duration: course.duration,
        module_count: course.modules?.length || 0,
        modules: course.modules?.map((m: any) => ({
          id: m._id?.toString(),
          title: m.title,
          content: m.content,
          type: m.type,
          topics: m.topics,
          quiz: m.quiz,
        })) || [],
        createdAt: course.createdAt,
      }));

      return NextResponse.json(normalizedCourses);
    }

    // Fallback to Supabase if no MongoDB courses
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const normalizedCourses = (data || []).map(course => ({
      ...course,
      id: course.id?.toString(),
      module_count: 0,
      modules: [],
    }));

    return NextResponse.json(normalizedCourses);
  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
