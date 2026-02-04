import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { labs } from '@data/labs';

// Use anon key for auth verification
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialized within the handler using the user's token
function getSupabaseUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  );
}

// Dynamic lab count based on actual labs data
const LAB_TOTAL = labs.length;

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userClient = getSupabaseUserClient(token);

    // Fetch lab completions using user client (respects RLS)
    const { data: completions, error } = await userClient
      .from('lab_completions')
      .select('lab_id')
      .eq('student_id', user.id);

    if (error) {
      console.error('Error fetching lab stats:', error);
      return NextResponse.json({
        totalLabs: LAB_TOTAL,
        completedLabs: 0,
        completionPercentage: 0,
        completedLabIds: [],
      });
    }

    const completedLabIds = (completions || []).map((c) => c.lab_id);
    const completedLabs = completedLabIds.length;
    const completionPercentage = (completedLabs / LAB_TOTAL) * 100;

    return NextResponse.json({
      totalLabs: LAB_TOTAL,
      completedLabs,
      completionPercentage,
      completedLabIds,
    });
  } catch (error) {
    console.error('Lab stats API error:', error);
    return NextResponse.json({
      totalLabs: LAB_TOTAL,
      completedLabs: 0,
      completionPercentage: 0,
      completedLabIds: [],
    });
  }
}
