import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { Course } from '@/lib/models/Course';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET a specific course by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try MongoDB first
    await connectDB();
    
    let course;
    if (mongoose.Types.ObjectId.isValid(id)) {
      course = await Course.findById(id).lean();
    } else {
      course = await Course.findOne({ code: id }).lean();
    }

    if (course) {
      return NextResponse.json({
        id: (course as any)._id?.toString(),
        title: (course as any).title,
        description: (course as any).description,
        code: (course as any).code,
        difficulty: (course as any).difficulty,
        duration: (course as any).duration,
        module_count: (course as any).modules?.length || 0,
        modules: (course as any).modules?.map((m: any) => ({
          id: m._id?.toString(),
          title: m.title,
          content: m.content,
          type: m.type,
          topics: m.topics,
          quiz: m.quiz,
        })) || [],
        createdAt: (course as any).createdAt,
      });
    }

    // Fallback to Supabase
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...data,
      id: data.id?.toString(),
      module_count: 0,
      modules: [],
    });
  } catch (error) {
    console.error('Course fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}
