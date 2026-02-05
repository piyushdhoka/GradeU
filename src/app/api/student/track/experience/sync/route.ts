import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import connectDB from '@/lib/mongodb';
import { StudentExperience } from '@/lib/models/StudentExperience';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Experience sync endpoint
// - Module stats (time, scroll, interactions) → Supabase
// - AI interactions → MongoDB
export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user from token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { courseId, moduleStats, aiInteraction } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    // Create user-scoped client for RLS
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    // Handle module stats → Supabase
    if (moduleStats && moduleStats.moduleId) {
      const moduleId = String(moduleStats.moduleId).trim();
      const timeSpent = Math.max(0, Math.floor(moduleStats.timeSpent || 0));
      const scrollDepth = Math.max(0, Math.min(100, Math.floor(moduleStats.scrollDepth || 0)));
      const interactions = Math.max(0, Math.floor(moduleStats.interactions || 0));

      // Check if record exists
      const { data: existing } = await userClient
        .from('module_experience')
        .select('id, time_spent, scroll_depth, interactions')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .eq('module_id', moduleId)
        .single();

      if (existing) {
        // Update existing
        await userClient
          .from('module_experience')
          .update({
            time_spent: existing.time_spent + timeSpent,
            scroll_depth: Math.max(existing.scroll_depth, scrollDepth),
            interactions: existing.interactions + interactions,
            last_accessed: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        // Insert new
        await userClient.from('module_experience').insert({
          student_id: user.id,
          course_id: courseId,
          module_id: moduleId,
          time_spent: timeSpent,
          scroll_depth: scrollDepth,
          interactions: interactions,
          last_accessed: new Date().toISOString(),
        });
      }
    }

    // Handle AI interactions → MongoDB
    if (aiInteraction && typeof aiInteraction === 'object') {
      await connectDB();

      const sanitizedInteraction = {
        query: String(aiInteraction.query || '').substring(0, 1000),
        responseSnippet: String(aiInteraction.responseSnippet || '').substring(0, 1000),
        timestamp: new Date(),
      };

      await StudentExperience.findOneAndUpdate(
        { studentId: user.id, courseId },
        {
          $push: { aiInteractions: sanitizedInteraction },
          $set: { updatedAt: new Date(), studentEmail: user.email || '' },
          $setOnInsert: { createdAt: new Date(), moduleStats: [] },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error) {
    console.error('Experience sync error:', error);
    return NextResponse.json({ error: 'Failed to sync experience' }, { status: 500 });
  }
}
