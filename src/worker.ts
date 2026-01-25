import { Worker, Job } from 'bullmq';
import { redisConnection } from './lib/queue';
import { supabaseAdmin } from './lib/supabaseAdmin';
import { callGeminiAPI, generateGeminiEmbedding } from './lib/ai';
import { addCourseLog, connectMongoDB, syncCourseToMongo } from './lib/mongodb';
import * as dotenv from 'dotenv';
// env vars are preloaded by -r dotenv/config, but we also check specific paths if needed
dotenv.config({ path: '.env' });

if (!process.env.REDIS_URL || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ Missing required environment variables (REDIS_URL or SUPABASE_URL)');
    process.exit(1);
}

console.log('🚀 Worker started. Listening for jobs...');

const worker = new Worker('course-generation', async (job: Job) => {
    const { jobId, courseTitle, modules, generalQuiz, finalAssessment } = job.data;
    console.log(`[Job ${jobId}] Starting processing: ${courseTitle}`);

    // Accumulator for MongoDB Sync
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedModules: any[] = [];

    try {
        await connectMongoDB();
        await addCourseLog(jobId, courseTitle, 'Worker started processing', 'INFO');

        // 1. Update Status to PROCESSING
        await supabaseAdmin.from('generation_jobs').update({ status: 'PROCESSING', progress: 0 }).eq('id', jobId);

        // 2. Create Course Record (Draft Mode)
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .insert({ title: courseTitle, is_published: false }) // Initially hidden/draft
            .select().single();

        if (courseError) throw courseError;
        const courseId = course.id;

        // Save courseId to job data for rollback context if needed
        await job.updateData({ ...job.data, courseIdForRollback: courseId });

        await addCourseLog(jobId, courseTitle, `Course created in DB: ${courseId}`, 'INFO', { courseId });

        // 3. Process Modules
        for (let i = 0; i < modules.length; i++) {
            const moduleData = modules[i];
            const progress = Math.round(((i) / modules.length) * 100);

            // Update Progress in Supabase
            await supabaseAdmin.from('generation_jobs').update({
                progress,
                current_module: moduleData.name
            }).eq('id', jobId);

            // Generate Content
            const topicsList = moduleData.topics && moduleData.topics.length > 0
                ? `\nFocus on the following key topics:\n${moduleData.topics.map((t: string) => `- ${t}`).join('\n')}`
                : '';

            const theoryPrompt = `Write a deep, educational, and technical theory guide for the module: "${moduleData.name}". 
            Topic of the course: "${courseTitle}".${topicsList}
            Provide the content in Markdown format. High detail is required.`;

            await addCourseLog(jobId, courseTitle, `Generating content for module: ${moduleData.name} (${moduleData.topics?.length || 0} topics)`, 'INFO');

            const theoryContent = await callGeminiAPI(theoryPrompt);

            // Add to accumulator
            generatedModules.push({
                title: moduleData.name,
                content: theoryContent,
                type: 'lecture',
                quiz: moduleData.quiz || []
            });

            // Upload to Supabase Storage
            const filePath = `${courseId}/${moduleData.name.replace(/[^a-zA-Z0-9]/g, '_')}.md`;
            const { error: uploadError } = await supabaseAdmin
                .storage
                .from('courses')
                .upload(filePath, theoryContent, {
                    contentType: 'text/markdown',
                    upsert: true
                });

            if (uploadError) {
                console.error('Storage Upload Error:', uploadError);
                // Fallback: Store in DB if upload fails? Or throw?
                // For now, let's throw to ensure data consistency
                throw uploadError;
            }

            // Store Module with File Path
            const { data: moduleRecord, error: moduleError } = await supabaseAdmin
                .from('modules')
                .insert({
                    course_id: courseId,
                    title: moduleData.name,
                    content_markdown: filePath, // Store path instead of raw content
                    module_order: i + 1,
                    topics: moduleData.topics || [] // Save topics
                })
                .select().single();

            if (moduleError) throw moduleError;

            // Generate & Store Embeddings (RAG)
            try {
                // Simple chunking by paragraphs (approx 500-1000 chars)
                const chunks = theoryContent.split('\n\n').filter(c => c.length > 50);

                for (const chunk of chunks) {
                    const embedding = await generateGeminiEmbedding(chunk);

                    await supabaseAdmin.from('module_embeddings').insert({
                        module_id: moduleRecord.id,
                        content: chunk,
                        embedding: embedding
                    });
                }
                await addCourseLog(jobId, courseTitle, `Embeddings stored for module: ${moduleData.name}`, 'INFO');
            } catch (embedError) {
                console.error(`[Embedding Error] Module ${moduleData.name}:`, embedError);
                // Don't fail the whole job, just log it
                await addCourseLog(jobId, courseTitle, `Embedding failed: ${embedError}`, 'WARN');
            }

            if (moduleError) throw moduleError;

            // Store Quizzes
            if (moduleData.quiz && moduleData.quiz.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const quizInsert = moduleData.quiz.map((q: any) => ({
                    module_id: moduleRecord.id,
                    question: q.question,
                    options: q.options,
                    correct_option: q.correctAnswer
                }));
                await supabaseAdmin.from('quizzes').insert(quizInsert);
            }

            await addCourseLog(jobId, courseTitle, `Module completed: ${moduleData.name}`, 'INFO', { moduleId: moduleRecord.id });
        }

        // 3.5 Process General Quiz (if exists)
        if (generalQuiz && generalQuiz.length > 0) {
            await addCourseLog(jobId, courseTitle, 'Processing General Course Quiz...', 'INFO');

            // Add to Accumulator
            generatedModules.unshift({
                title: "Initial Assessment",
                content: "Complete this assessment to test your initial knowledge.",
                type: 'initial_assessment',
                quiz: generalQuiz
            });

            // Create "Initial Assessment" Module at the beginning
            const { data: assessmentModule, error: moduleError } = await supabaseAdmin
                .from('modules')
                .insert({
                    course_id: courseId,
                    title: "Initial Assessment",
                    content_markdown: "", // No content, just quiz
                    module_order: 0 // Set as first module
                })
                .select().single();

            if (moduleError) throw moduleError;

            // Store Quizzes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const quizInsert = generalQuiz.map((q: any) => ({
                module_id: assessmentModule.id,
                question: q.question,
                options: q.options,
                correct_option: q.correctAnswer
            }));
            await supabaseAdmin.from('quizzes').insert(quizInsert);

            await addCourseLog(jobId, courseTitle, 'General Assessment created successfully', 'INFO');
        }

        // 3.6 Process Final Assessment (if exists)
        if (finalAssessment && finalAssessment.length > 0) {
            await addCourseLog(jobId, courseTitle, 'Processing Final Assessment...', 'INFO');

            // Add to Accumulator
            generatedModules.push({
                title: "Final Assessment",
                content: "Complete this final assessment to earn your certificate.",
                type: 'final_assessment',
                quiz: finalAssessment
            });

            // Create "Final Assessment" Module at the end
            const { data: finalModule, error: moduleError } = await supabaseAdmin
                .from('modules')
                .insert({
                    course_id: courseId,
                    title: "Final Assessment",
                    content_markdown: "", // No content, just quiz
                    module_order: modules.length + 1 // Set as last module
                })
                .select().single();

            if (moduleError) throw moduleError;

            // Store Quizzes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const quizInsert = finalAssessment.map((q: any) => ({
                module_id: finalModule.id,
                question: q.question,
                options: q.options,
                correct_option: q.correctAnswer
            }));
            await supabaseAdmin.from('quizzes').insert(quizInsert);

            await addCourseLog(jobId, courseTitle, 'Final Assessment created successfully', 'INFO');
        }

        // 4. Finalize
        await supabaseAdmin.from('generation_jobs').update({
            status: 'COMPLETED',
            progress: 100,
            results: { courseId }
        }).eq('id', jobId);

        // SYNC TO MONGODB FOR CYBER_COACH
        await syncCourseToMongo(courseId, courseTitle, generatedModules);

        await addCourseLog(jobId, courseTitle, 'Job successfully completed', 'INFO', { courseId });
        console.log(`[Job ${jobId}] Completed successfully.`);

    } catch (error: any) {
        console.error(`[Job ${jobId}] Failed:`, error);
        await addCourseLog(jobId, courseTitle, `Job failed: ${error.message}`, 'ERROR', { error });

        await supabaseAdmin.from('generation_jobs').update({
            status: 'FAILED',
            error: error.message
        }).eq('id', jobId);

        throw error;
    }

}, {
    connection: redisConnection as any,
    concurrency: 5 // Process 5 jobs at a time
});

worker.on('completed', (job: Job) => {
    console.log(`[${job.id}] Finished`);
});

worker.on('failed', (job: Job | undefined, err: Error) => {
    console.log(`[${job?.id}] Failed with ${err.message}`);
});
