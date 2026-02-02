import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import connectDB from '@/lib/mongodb';
import { StudentProgress } from '@/lib/models/StudentProgress';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET module progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const { courseId, moduleId } = await params;
    
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

    const progress = await StudentProgress.findOne({
      studentEmail: user.email || '',
      courseId: courseId,
      moduleId: moduleId,
    }).lean();

    if (!progress) {
      return NextResponse.json({
        completed: false,
        quizScore: null,
        completedAt: null,
        completedTopics: [],
      });
    }

    return NextResponse.json({
      completed: (progress as any).completed,
      quizScore: (progress as any).quizScore,
      completedAt: (progress as any).updatedAt,
      completedTopics: (progress as any).completedTopics || [],
    });
  } catch (error) {
    console.error('Module progress GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

// UPDATE module progress
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  try {
    const { courseId, moduleId } = await params;
    const body = await request.json();
    const { completed, quizScore, completedTopics } = body;
    
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

    if (typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'completed must be a boolean' }, { status: 400 });
    }

    await connectDB();

    // Query by studentEmail since that's what the existing MongoDB index uses
    // Also include studentId for new records
    const studentEmail = user.email || '';
    
    // Upsert progress in MongoDB - use studentEmail in filter to match existing index
    await StudentProgress.findOneAndUpdate(
      {
        studentEmail: studentEmail,
        courseId: courseId,
        moduleId: moduleId,
      },
      {
        $set: {
          studentId: user.id,
          studentEmail: studentEmail,
          completed,
          quizScore: quizScore || null,
          completedTopics: completedTopics || [],
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: 'Progress updated successfully' });
  } catch (error) {
    console.error('Module progress PUT error:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
