import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { StudentExperience } from '@/lib/models/StudentExperience';

// Experience sync endpoint for tracking time spent, scroll depth, etc.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, studentEmail, courseId, moduleStats, aiInteraction } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    await connectDB();

    const now = new Date();
    let sanitizedInteraction = null;

    if (aiInteraction && typeof aiInteraction === 'object' && !Array.isArray(aiInteraction)) {
      sanitizedInteraction = {
        query: String(aiInteraction.query || '').substring(0, 1000),
        responseSnippet: String(aiInteraction.responseSnippet || '').substring(0, 1000),
        timestamp: now
      };
    }

    if (moduleStats) {
      const moduleId = String(moduleStats.moduleId).trim();
      const interactions = moduleStats.interactions || 0;
      const timeSpent = Math.max(0, moduleStats.timeSpent || 0);
      const scrollDepth = Math.max(0, Math.min(100, moduleStats.scrollDepth || 0));

      // Try to update existing module entry - query by both studentId and courseId
      const updated = await StudentExperience.findOneAndUpdate(
        {
          studentId,
          courseId,
          "moduleStats.moduleId": moduleId
        },
        {
          $inc: {
            "moduleStats.$.timeSpent": timeSpent,
            "moduleStats.$.interactions": interactions,
            totalTimeSpent: timeSpent
          },
          $max: { "moduleStats.$.scrollDepth": scrollDepth },
          $set: {
            "moduleStats.$.lastAccessed": now,
            updatedAt: now,
            ...(studentEmail ? { studentEmail } : {})
          },
          ...(sanitizedInteraction ? { $push: { aiInteractions: sanitizedInteraction } } : {})
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
                lastAccessed: now
              },
              ...(sanitizedInteraction ? { aiInteractions: sanitizedInteraction } : {})
            },
            $inc: { totalTimeSpent: timeSpent },
            $set: { 
              updatedAt: now,
              ...(studentEmail ? { studentEmail } : {})
            },
            $setOnInsert: { createdAt: now }
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
