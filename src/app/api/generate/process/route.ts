import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { courseQueue } from '@/lib/queue';
import { v4 as uuidv4 } from 'uuid';
import { addCourseLog } from '@/lib/mongodb';
import { getStaffUser } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        // 0. Only signed-in teachers/admins can queue (paid) AI generation
        const staff = await getStaffUser();
        if (!staff) {
            return NextResponse.json({ success: false, error: 'Teacher access required' }, { status: 401 });
        }
        const userId = staff.user.id;
        const teacherName = staff.profile.full_name;

        const { courseTitle, modules, generalQuiz, finalAssessment, description, difficulty, duration, category } = await req.json();

        if (!courseTitle || !modules || !Array.isArray(modules)) {
            return NextResponse.json({ success: false, error: 'Invalid course data' }, { status: 400 });
        }

        // 1. Create Job Entry
        const jobId = uuidv4();
        const { error: jobError } = await supabaseAdmin
            .from('generation_jobs')
            .insert({
                id: jobId,
                course_title: courseTitle,
                status: 'PENDING',
                progress: 0,
                metadata: { modules, description, difficulty, duration, category, createdBy: userId, createdByName: teacherName }
            });

        if (jobError) throw jobError;

        // 2. Add to BullMQ (Redis)
        await courseQueue.add('generate-course', {
            jobId,
            courseTitle,
            modules,
            generalQuiz, // Pass to worker
            finalAssessment, // Pass to worker
            description,
            difficulty,
            duration,
            category,
            createdBy: userId // Pass UUID for courses.created_by column
        }, {
            jobId: jobId // Use same ID for consistency
        });

        // 3. Log to MongoDB
        await addCourseLog(jobId, courseTitle, 'Job successfully queued in Redis', 'INFO');

        return NextResponse.json({
            success: true,
            jobId: jobId,
            message: 'Job queued in BullMQ. Polling started.'
        });

    } catch (error: any) {
        console.error('Pipeline Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to queue course job' },
            { status: 500 }
        );
    }
}
