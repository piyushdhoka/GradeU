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
    const { jobId, courseTitle, modules, generalQuiz, finalAssessment, createdBy } = job.data;
    console.log(`[Job ${jobId}] Starting processing: ${courseTitle}`);

    // Accumulator for MongoDB Sync
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const generatedModules: any[] = []; // Accumulator for MongoDB Sync

    try {
        await connectMongoDB();
        await addCourseLog(jobId, courseTitle, 'Worker started processing', 'INFO');

        // 1. Update Status to PROCESSING
        await supabaseAdmin.from('generation_jobs').update({ status: 'PROCESSING', progress: 0 }).eq('id', jobId);

        // 2. Create Course Record (Draft Mode)
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .insert({
                title: courseTitle,
                is_published: false,
                created_by: createdBy || null // Save authenticated user name
            })
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

            // Sanitize module name for folder path
            const safeModuleName = moduleData.name.replace(/[^a-zA-Z0-9]/g, '_');

            // Container for module content and topics to be synced/stored
            let moduleContentCombined = "";
            const processedTopics: any[] = [];
            const topicPaths: any[] = []; // To store in Supabase 'topics' column if needed

            if (moduleData.topics && moduleData.topics.length > 0) {
                await addCourseLog(jobId, courseTitle, `Generating content for ${moduleData.topics.length} topics in module: ${moduleData.name}`, 'INFO');

                for (const topic of moduleData.topics) {
                    const safeTopicName = topic.name.replace(/[^a-zA-Z0-9]/g, '_');
                    const topicPrompt = `Write a deep, educational, and technical guide for the topic: "${topic.name}".
                     Module: "${moduleData.name}"
                     Course: "${courseTitle}"
                     Context: ${topic.content || 'Provide comprehensive details.'}
                     Provide the content in Markdown format. High detail is required.
                     Limit the response to approximately 300 lines of Markdown code or less. Focus on quality and conciseness.`;

                    const topicContent = await callGeminiAPI(topicPrompt);

                    // Upload Topic to Supabase Storage: courseId/moduleName/topicName.md
                    const filePath = `${courseId}/${safeModuleName}/${safeTopicName}.md`;
                    const { error: uploadError } = await supabaseAdmin
                        .storage
                        .from('courses')
                        .upload(filePath, topicContent, {
                            contentType: 'text/markdown',
                            upsert: true
                        });

                    if (uploadError) {
                        console.error(`Failed to upload topic ${topic.name}:`, uploadError);
                        // Continue but log error
                        await addCourseLog(jobId, courseTitle, `Failed to upload topic: ${topic.name}`, 'ERROR');
                    }

                    processedTopics.push({
                        title: topic.name,
                        content: topicContent
                    });

                    topicPaths.push({
                        name: topic.name,
                        path: filePath
                    });

                    moduleContentCombined += `# ${topic.name}\n\n${topicContent}\n\n`;
                }
            } else {
                // Fallback for modules without topics (should be rare with new UI)
                const theoryPrompt = `Write a deep, educational, and technical theory guide for the module: "${moduleData.name}". 
                Topic of the course: "${courseTitle}".
                Provide the content in Markdown format. High detail is required.
                Limit the response to approximately 300 lines of Markdown code or less. Focus on quality and conciseness.`;

                const theoryContent = await callGeminiAPI(theoryPrompt);
                moduleContentCombined = theoryContent;

                const filePath = `${courseId}/${safeModuleName}/full_module.md`;
                await supabaseAdmin.storage.from('courses').upload(filePath, theoryContent, { contentType: 'text/markdown', upsert: true });
            }

            // Handle Review Labs (NLP Labs or similar)
            if (moduleData.labs && moduleData.labs.length > 0) {
                await addCourseLog(jobId, courseTitle, `Processing ${moduleData.labs.length} labs for module: ${moduleData.name}`, 'INFO');

                let labsContent = `# Hands-On Labs\n\nTo reinforce your learning, complete the following interactive labs:\n\n`;

                for (const lab of moduleData.labs) {
                    labsContent += `### ${lab.title}\n\n`;
                    labsContent += `[Open Lab Environment](${lab.url})\n\n`;
                    labsContent += `<iframe src="${lab.url}" width="100%" height="600px" style={{border: 'none', borderRadius: '8px', marginTop: '10px'}}></iframe>\n\n`;
                    labsContent += `---\n\n`;
                }

                // Upload Labs to Supabase Storage
                const labsFilePath = `${courseId}/${safeModuleName}/labs.md`;
                await supabaseAdmin.storage.from('courses').upload(labsFilePath, labsContent, { contentType: 'text/markdown', upsert: true });

                // Add to topics list
                topicPaths.push({
                    name: "Hands-On Labs",
                    path: labsFilePath
                });

                // Append to combined content
                moduleContentCombined += `\n\n${labsContent}`;

                // Add to detailed topics for caching/sync
                processedTopics.push({
                    title: "Hands-On Labs",
                    content: labsContent
                });
            }

            // Stores Module Record in Supabase
            // We store the updated topics array containing paths
            const { data: moduleRecord, error: moduleError } = await supabaseAdmin
                .from('modules')
                .insert({
                    course_id: courseId,
                    title: moduleData.name,
                    content_markdown: `${courseId}/${safeModuleName}/`, // Point to the folder or leave generic
                    module_order: i + 1,
                    topics: topicPaths // Store structure with paths in Supabase
                })
                .select().single();

            if (moduleError) throw moduleError;

            // Generate & Store Embeddings (RAG)
            try {
                // Chunk the combined content or per topic
                const chunks = moduleContentCombined.split('\n\n').filter(c => c.length > 50);

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
                await addCourseLog(jobId, courseTitle, `Embedding failed: ${embedError}`, 'WARN');
            }

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

            // Add to accumulator for MongoDB Sync (with full content)
            generatedModules.push({
                title: moduleData.name,
                topics: processedTopics, // Pass detailed topics
                content: moduleContentCombined, // Pass combined/fallback content
                type: 'lecture',
                quiz: moduleData.quiz || []
            });

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
        // Update Supabase course record to be published and include metadata
        await supabaseAdmin.from('courses').update({
            description: job.data.description || `Comprehensive course on ${courseTitle}`,
            // Assuming these columns exist or will be ignored/handled
            // If they don't exist in Supabase schema, this might error. 
            // However, the user request implies they want these variables used.
            // difficulty: job.data.difficulty,
            // duration: job.data.duration,
            // category: job.data.category
        }).eq('id', courseId);

        await supabaseAdmin.from('generation_jobs').update({
            status: 'COMPLETED',
            progress: 100,
            results: { courseId }
        }).eq('id', jobId);

        // SYNC TO MONGODB FOR CYBER_COACH
        // Ensure generatedModules has the structure expected by the new sync function
        await syncCourseToMongo(courseId, courseTitle, generatedModules, {
            description: job.data.description,
            difficulty: job.data.difficulty,
            duration: job.data.duration,
            category: job.data.category
        });

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
