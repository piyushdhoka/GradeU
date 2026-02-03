import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Webhook for external lab completion sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, labId, completedAt, metadata } = body;

    // Validation
    if (!studentId || typeof studentId !== 'string') {
      return NextResponse.json({
        error: 'Invalid studentId. Must be a valid UUID string.'
      }, { status: 400 });
    }

    if (!labId || typeof labId !== 'string' || labId.trim().length === 0) {
      return NextResponse.json({
        error: 'Invalid labId. Must be a non-empty string.'
      }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studentId)) {
      return NextResponse.json({
        error: 'Invalid studentId format. Must be a valid UUID.'
      }, { status: 400 });
    }

    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (!process.env.LAB_WEBHOOK_SECRET || webhookSecret !== process.env.LAB_WEBHOOK_SECRET) {
      return NextResponse.json({
        error: 'Unauthorized: Invalid or missing webhook secret'
      }, { status: 401 });
    }

    // Check if already completed (use admin to bypass RLS)
    const { data: existing } = await supabaseAdmin
      .from('lab_completions')
      .select('*')
      .eq('student_id', studentId.trim())
      .eq('lab_id', labId.trim())
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Lab already completed',
        completion: {
          id: existing[0].id,
          labId: existing[0].lab_id,
          completedAt: existing[0].completed_at,
        }
      });
    }

    // Insert new completion (use admin to bypass RLS)
    const { data: completion, error } = await supabaseAdmin
      .from('lab_completions')
      .insert({
        student_id: studentId.trim(),
        lab_id: labId.trim(),
        completed_at: completedAt || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Lab webhook error:', error);
      return NextResponse.json({ error: 'Failed to sync lab completion' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Lab completion synced successfully',
      completion: {
        id: completion.id,
        labId: completion.lab_id,
        completedAt: completion.completed_at,
      }
    });
  } catch (error) {
    console.error('Lab webhook error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
