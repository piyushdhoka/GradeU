import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { CourseLog, connectMongoDB } from '@/lib/mongodb';
import { getStaffUser } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await getStaffUser())) {
        return NextResponse.json({ success: false, error: 'Teacher access required' }, { status: 401 });
    }

    const { id: jobId } = await params;

    try {
        // 1. Fetch Job Status from Supabase
        const { data: job, error } = await supabaseAdmin
            .from('generation_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
        }

        // 2. Fetch Logs from MongoDB
        let logs: any[] = [];
        try {
            await connectMongoDB();
            logs = await CourseLog.find({ jobId }).sort({ timestamp: 1 }).lean();
        } catch (mongoError) {
            console.error('Failed to fetch logs:', mongoError);
            // Don't fail the whole request just because logs are missing
        }

        return NextResponse.json({
            success: true,
            job,
            logs
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
