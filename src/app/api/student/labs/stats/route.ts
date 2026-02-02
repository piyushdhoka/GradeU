import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use anon key for auth verification
const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Use service role key for database operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LAB_TOTAL = 6;

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch lab completions using admin client (bypasses RLS)
    const { data: completions, error } = await supabaseAdmin
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

    const completedLabIds = (completions || []).map(c => c.lab_id);
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
