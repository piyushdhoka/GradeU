import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import connectDB from '@/lib/mongodb';
import { StudentExperience } from '@/lib/models/StudentExperience';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Experience sync endpoint - persists to Supabase (primary) and MongoDB (analytics)
// Fire-and-forget semantics: failures must not block UX.
export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      // Silently accept - don't block UI
      return NextResponse.json({ success: true }, { status: 202 });
    }

    // Verify user from token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      // Silently accept - don't block UI
      return NextResponse.json({ success: true }, { status: 202 });
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const body = await request.json();
    const { courseId, moduleStats, aiInteraction } = body;

    if (!courseId) {
      return NextResponse.json({ success: true }, { status: 202 });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const studentId = user.id;
    const studentEmail = user.email || '';

    // Handle module stats -> Supabase + MongoDB
    if (moduleStats && moduleStats.moduleId) {
      const moduleId = String(moduleStats.moduleId).trim();
      const timeSpent = Math.max(0, Math.floor(moduleStats.timeSpent || 0));
      const scrollDepth = Math.max(0, Math.min(100, Math.floor(moduleStats.scrollDepth || 0)));
      const interactions = Math.max(0, Math.floor(moduleStats.interactions || 0));

      // 1) Supabase module_experience (authoritative for student dashboard + completion checks)
      try {
        const { data: existingRows, error: existingError } = await userClient
          .from('module_experience')
          .select('id, time_spent, scroll_depth, interactions')
          .eq('student_id', studentId)
          .eq('course_id', courseId)
          .eq('module_id', moduleId)
          .limit(1);

        if (existingError) {
          console.error('Supabase experience read error:', existingError);
        } else {
          const existing = existingRows?.[0];

          if (existing?.id) {
            const { error: updateError } = await userClient
              .from('module_experience')
              .update({
                time_spent: (existing.time_spent || 0) + timeSpent,
                scroll_depth: Math.max(existing.scroll_depth || 0, scrollDepth),
                interactions: (existing.interactions || 0) + interactions,
                last_accessed: nowIso,
                updated_at: nowIso,
              })
              .eq('id', existing.id);

            if (updateError) {
              console.error('Supabase experience update error:', updateError);
            }
          } else {
            const { error: insertError } = await userClient.from('module_experience').insert({
              student_id: studentId,
              course_id: courseId,
              module_id: moduleId,
              time_spent: timeSpent,
              scroll_depth: scrollDepth,
              interactions,
              last_accessed: nowIso,
              created_at: nowIso,
              updated_at: nowIso,
            });

            if (insertError) {
              console.error('Supabase experience insert error:', insertError);
            }
          }
        }
      } catch (supabaseWriteError) {
        console.error('Supabase experience persistence error:', supabaseWriteError);
      }

      // 2) MongoDB analytics (existing behavior)
      try {
        await connectDB();

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
          }
        );

        if (!updated) {
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
              },
              $inc: { totalTimeSpent: timeSpent },
              $set: { updatedAt: now, studentEmail },
              $setOnInsert: { createdAt: now, aiInteractions: [] },
            },
            { upsert: true }
          );
        }
      } catch (mongoWriteError) {
        console.error('Mongo experience persistence error:', mongoWriteError);
      }
    }

    // Handle AI interactions -> MongoDB
    if (aiInteraction && typeof aiInteraction === 'object') {
      try {
        await connectDB();
        const sanitizedInteraction = {
          query: String(aiInteraction.query || '').substring(0, 1000),
          responseSnippet: String(aiInteraction.responseSnippet || '').substring(0, 1000),
          timestamp: now,
        };

        await StudentExperience.findOneAndUpdate(
          { studentId, courseId },
          {
            $push: { aiInteractions: sanitizedInteraction },
            $set: { updatedAt: now, studentEmail },
            $setOnInsert: { createdAt: now, moduleStats: [], totalTimeSpent: 0 },
          },
          { upsert: true }
        );
      } catch (mongoAiError) {
        console.error('Mongo AI interaction persistence error:', mongoAiError);
      }
    }

    return NextResponse.json({ success: true }, { status: 202 });
  } catch (error) {
    console.error('Experience sync error:', error);
    // Still return 202 - experience tracking should never block the UI
    return NextResponse.json({ success: true }, { status: 202 });
  }
}
