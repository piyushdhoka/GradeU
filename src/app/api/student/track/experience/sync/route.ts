import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import connectDB from '@/lib/mongodb';
import { StudentExperience } from '@/lib/models/StudentExperience';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Experience sync endpoint for tracking time spent, scroll depth, etc.
// Now requires authentication to prevent spoofing
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

    // Use authenticated user's ID and email instead of trusting client
    const studentId = user.id;
    const studentEmail = user.email || '';

    if (!courseId) {
      return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
    }

    await connectDB();

    const now = new Date();
    let sanitizedInteraction = null;

    if (aiInteraction && typeof aiInteraction === 'object' && !Array.isArray(aiInteraction)) {
      sanitizedInteraction = {
        query: String(aiInteraction.query || '').substring(0, 1000),
        responseSnippet: String(aiInteraction.responseSnippet || '').substring(0, 1000),
        timestamp: now,
      };
    }

    if (moduleStats) {
      const moduleId = String(moduleStats.moduleId).trim();
      const interactions = moduleStats.interactions || 0;
      const timeSpent = Math.max(0, moduleStats.timeSpent || 0);
      const scrollDepth = Math.max(0, Math.min(100, moduleStats.scrollDepth || 0));

      // Try to update existing module entry
      const updated = await StudentExperience.findOneAndUpdate(
        {
          studentId,
          courseId,
          'moduleStats.moduleId': moduleId,
        },
        {
          $inc: {
            'moduleStats.$.timeSpent': timeSpent,
            'moduleStats.$.interactions': interactions,
            totalTimeSpent: timeSpent,
          },
          $max: { 'moduleStats.$.scrollDepth': scrollDepth },
          $set: {
            'moduleStats.$.lastAccessed': now,
            updatedAt: now,
            studentEmail,
          },
          ...(sanitizedInteraction ? { $push: { aiInteractions: sanitizedInteraction } } : {}),
        }
      );

      if (!updated) {
        // Create new or add module to existing experience
        await StudentExperience.findOneAndUpdate(
          { studentId, courseId },
          {
            $push: {
              moduleStats: {
                moduleId,
                timeSpent,
                scrollDepth,
                interactions,
                lastAccessed: now,
              },
              ...(sanitizedInteraction ? { aiInteractions: sanitizedInteraction } : {}),
            },
            $inc: { totalTimeSpent: timeSpent },
            $set: {
              updatedAt: now,
              studentEmail,
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true }
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error) {
    console.error('Experience sync error:', error);
    return NextResponse.json({ error: 'Failed to sync experience' }, { status: 500 });
  }
}
