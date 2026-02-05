import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { courseQueue } from '@/lib/queue';
import { v4 as uuidv4 } from 'uuid';
import { addCourseLog } from '@/lib/mongodb';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { courseTitle, modules, generalQuiz, finalAssessment, description, difficulty, duration, category } = await req.json();

        if (!courseTitle || !modules || !Array.isArray(modules)) {
            return NextResponse.json({ success: false, error: 'Invalid course data' }, { status: 400 });
        }

        // 0. Get Authenticated User
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        // API route doesn't need to set cookies usually, but required by type
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        let teacherName = null;
        let userId = null;

        if (user) {
            userId = user.id;
            // Fetch profile
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();

            if (profile) {
                teacherName = profile.full_name;
            }
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
