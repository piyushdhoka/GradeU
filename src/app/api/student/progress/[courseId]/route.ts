import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import connectDB from '@/lib/mongodb';
import { StudentProgress } from '@/lib/models/StudentProgress';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET progress for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    
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

    await connectDB();

    // Fetch all module progress for this course from MongoDB
    // Use studentEmail to match existing MongoDB index
    const progress = await StudentProgress.find({
      studentEmail: user.email || '',
      courseId: courseId,
    }).lean();

    // Convert to a map of moduleId -> progress
    const progressMap: Record<string, any> = {};
    (progress || []).forEach((p: any) => {
      progressMap[p.moduleId] = {
        completed: p.completed,
        quizScore: p.quizScore,
        completedAt: p.updatedAt,
        completedTopics: p.completedTopics || [],
      };
    });

    return NextResponse.json(progressMap);
  } catch (error) {
    console.error('Course progress error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
