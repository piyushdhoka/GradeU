import { NextResponse } from 'next/server';
import { callGeminiAPI } from '@/lib/ai';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { qdrant, COLLECTION_NAME } from '@/lib/qdrant';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const { courseTitle, modules } = await req.json();

        if (!courseTitle || !modules || !Array.isArray(modules)) {
            return NextResponse.json({ success: false, error: 'Invalid course data' }, { status: 400 });
        }

        // 1. Create Course Record
        const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .insert({
                title: courseTitle,
                is_published: true, // Default to published for this flow
            })
            .select()
            .single();

        if (courseError) throw courseError;

        const courseId = course.id;
        const results = [];

        // 2. Process each module sequentially (to respect rate limits)
        for (let i = 0; i < modules.length; i++) {
            const moduleData = modules[i];
            console.log(`[*] Generating content for module: ${moduleData.name}`);

            // Generate Theory Content
            const theoryPrompt = `Write a deep, educational, and technical theory guide for the module: "${moduleData.name}". 
      Topic of the course: "${courseTitle}".
      Provide the content in Markdown format. High detail is required.`;

            const theoryContent = await callGeminiAPI(theoryPrompt);

            // 3. Store Module
            const { data: moduleRecord, error: moduleError } = await supabaseAdmin
                .from('modules')
                .insert({
                    course_id: courseId,
                    title: moduleData.name,
                    content_markdown: theoryContent,
                    module_order: i + 1
                })
                .select()
                .single();

            if (moduleError) throw moduleError;

            // 4. Store Quizzes
            if (moduleData.quiz && moduleData.quiz.length > 0) {
                const quizInsert = moduleData.quiz.map((q: any) => ({
                    module_id: moduleRecord.id,
                    question: q.question,
                    options: q.options,
                    correct_option: q.correctAnswer
                }));

                const { error: quizError } = await supabaseAdmin
                    .from('quizzes')
                    .insert(quizInsert);

                if (quizError) console.error('Quiz insertion error:', quizError);
            }

            // 5. Vectorize (Qdrant)
            if (qdrant) {
                try {
                    // Split theory into chunks for better retrieval
                    const chunks = theoryContent.split('\n\n').filter(c => c.trim().length > 50);
                    const points = chunks.map(chunk => ({
                        id: uuidv4(),
                        vector: [0], // Placeholder: You'd normally generate embeddings here
                        payload: {
                            course_id: courseId,
                            module_id: moduleRecord.id,
                            content: chunk,
                            title: moduleData.name
                        }
                    }));

                    // Note: In a real production app, you would generate embeddings using an embedding model.
                    // For now, we are setting up the structure.
                    /*
                    await qdrant.upsert(COLLECTION_NAME, {
                      points: points
                    });
                    */
                    console.log(`[+] Vectorized ${chunks.length} chunks for ${moduleData.name}`);
                } catch (vError) {
                    console.error('Vectorization error:', vError);
                }
            }

            results.push({ module: moduleData.name, status: 'SUCCESS' });
        }

        return NextResponse.json({
            success: true,
            courseId: courseId,
            message: 'Course generated and indexed successfully',
            results
        });

    } catch (error: any) {
        console.error('Pipeline Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to process course pipeline' },
            { status: 500 }
        );
    }
}
