import { NextResponse } from 'next/server';
import { callGeminiAPI } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    // This route is intended to be called internally (or via a secure webhook)
    const { jobId } = await req.json();

    try {
        // 1. Fetch Job
        const { data: job, error: fetchError } = await supabaseAdmin
            .from('generation_jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (fetchError || !job) throw new Error('Job not found');
        if (job.status !== 'PENDING') return NextResponse.json({ success: true, message: 'Job already processed' });

        // 2. Update status to PROCESSING
        await supabaseAdmin.from('generation_jobs').update({ status: 'PROCESSING' }).eq('id', jobId);

        const { course_title, metadata } = job;
        const modules = metadata.modules;

        // 3. Create Course Record
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .insert({ title: course_title, is_published: true })
            .select().single();

        if (courseError) throw courseError;
        const courseId = course.id;

        // 4. Process Modules
        for (let i = 0; i < modules.length; i++) {
            const moduleData = modules[i];

            // Update Progress
            const progress = Math.round(((i) / modules.length) * 100);
            await supabaseAdmin.from('generation_jobs').update({
                progress,
                current_module: moduleData.name
            }).eq('id', jobId);

            // Generate Content
            const theoryPrompt = `Write a deep, educational, and technical theory guide for the module: "${moduleData.name}". 
            Topic of the course: "${course_title}".
            Provide the content in Markdown format. High detail is required.`;

            const theoryContent = await callGeminiAPI(theoryPrompt);

            // Store Module
            const { data: moduleRecord, error: moduleError } = await supabaseAdmin
                .from('modules')
                .insert({
                    course_id: courseId,
                    title: moduleData.name,
                    content_markdown: theoryContent,
                    module_order: i + 1,
                    topics: moduleData.topics || [] // Save topics
                })
                .select().single();

            if (moduleError) throw moduleError;

            // Store Quizzes
            if (moduleData.quiz && moduleData.quiz.length > 0) {
                const quizInsert = moduleData.quiz.map((q: any) => ({
                    module_id: moduleRecord.id,
                    question: q.question,
                    options: q.options,
                    correct_option: q.correctAnswer
                }));
                await supabaseAdmin.from('quizzes').insert(quizInsert);
            }
        }

        // 5. Finalize Job
        await supabaseAdmin.from('generation_jobs').update({
            status: 'COMPLETED',
            progress: 100,
            results: { courseId }
        }).eq('id', jobId);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error(`[Worker Error for ${jobId}]:`, error);
        await supabaseAdmin.from('generation_jobs').update({
            status: 'FAILED',
            error: error.message
        }).eq('id', jobId);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
