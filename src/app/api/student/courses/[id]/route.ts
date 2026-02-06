import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin client for storage operations that bypass RLS (required for listing contents)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET a specific course by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        console.log(`📚 [courses/[id]] Fetching course: ${id}`);

        // Step 1: Fetch course
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('id, title, description, is_published, certificate_enabled, created_at, category, estimated_hours')
            .eq('id', id)
            .single();

        if (courseError) {
            console.error('❌ [courses/[id]] Course query error:', courseError);
            if (courseError.code === 'PGRST116') {
                return NextResponse.json({ error: 'Course not found' }, { status: 404 });
            }
            return NextResponse.json({ error: 'Failed to fetch course', details: courseError.message }, { status: 500 });
        }

        console.log(`✅ [courses/[id]] Found course: ${course.title}`);

        // Step 2: Fetch modules for this course
        const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('id, title, content_markdown, module_order, topics, type')
            .eq('course_id', id)
            .order('module_order', { ascending: true });

        if (modulesError) {
            console.error('❌ [courses/[id]] Modules query error:', modulesError);
        }

        console.log(`✅ [courses/[id]] Found ${modules?.length || 0} modules for course`);

        // Step 3: Resolve markdown content for modules if it's a file path or folder
        const resolvedModules = await Promise.all(
            (modules || []).map(async (m) => {
                let content = m.content_markdown || '';

                // If content_markdown looks like a storage path
                const isStoragePath = content.includes('/') && !content.includes('\n') && !content.includes('#');

                if (isStoragePath || content.endsWith('.md')) {
                    try {
                        let combinedContent = '';

                        // Determine if it's a folder (ends with / or has no dot extension)
                        const isFolder = content.endsWith('/') || !content.split('/').pop()?.includes('.');

                        if (isFolder) {
                            const folderPath = content.endsWith('/') ? content.slice(0, -1) : content;

                            // Use admin client to list folder contents (bypasses RLS)
                            const { data: files, error: listError } = await supabaseAdmin.storage
                                .from('courses')
                                .list(folderPath);

                            if (listError) {
                                console.error(`[courses/[id]] Error listing folder ${folderPath}:`, listError);
                            } else if (files && files.length > 0) {
                                // Filter for .md files and sort by name
                                const mdFiles = files
                                    .filter(f => f.name.toLowerCase().endsWith('.md'))
                                    .sort((a, b) => a.name.localeCompare(b.name));

                                if (mdFiles.length > 0) {
                                    const contents = await Promise.all(
                                        mdFiles.map(async (f) => {
                                            const { data: { publicUrl } } = supabaseAdmin.storage
                                                .from('courses')
                                                .getPublicUrl(`${folderPath}/${f.name}`);

                                            const response = await fetch(publicUrl);
                                            return response.ok ? await response.text() : '';
                                        })
                                    );
                                    combinedContent = contents.filter(Boolean).join('\n\n---\n\n');
                                }
                            }
                        } else if (content.endsWith('.md')) {
                            // Direct file path
                            const { data: { publicUrl } } = supabaseAdmin.storage
                                .from('courses')
                                .getPublicUrl(content);

                            const response = await fetch(publicUrl);
                            if (response.ok) {
                                combinedContent = await response.text();
                            }
                        }

                        if (combinedContent) {
                            content = combinedContent;
                            console.log(`[courses/[id]] Resolved MD for module ${m.id} (${content.length} chars)`);
                        }
                    } catch (e) {
                        console.error(`[courses/[id]] Error resolving MD for module ${m.id}:`, e);
                    }
                }

                return {
                    ...m,
                    content_markdown: content
                };
            })
        );

        // Step 4: Fetch quizzes for each module
        const moduleIds = resolvedModules.map(m => m.id);
        let quizzes: any[] = [];

        if (moduleIds.length > 0) {
            const { data: quizData, error: quizError } = await supabase
                .from('quizzes')
                .select('id, module_id, question, options, correct_option')
                .in('module_id', moduleIds);

            if (quizError) {
                console.error('❌ [courses/[id]] Quizzes query error:', quizError);
            } else {
                quizzes = quizData || [];
                console.log(`✅ [courses/[id]] Found ${quizzes.length} quizzes`);
            }
        }

        // Step 5: Format response for frontend
        const normalizedModules = resolvedModules.map(m => {
            return {
                id: m.id,
                title: m.title,
                content: m.content_markdown || '',
                topics: m.topics || [],
                type: m.type || 'lecture',
                order: m.module_order,
                quiz: quizzes
                    .filter(q => q.module_id === m.id)
                    .map(quiz => ({
                        id: quiz.id,
                        question: quiz.question,
                        options: quiz.options,
                        correctAnswer: quiz.correct_option
                    }))
            };
        });

        const response = {
            id: course.id,
            title: course.title,
            description: course.description,
            certificate_enabled: course.certificate_enabled,
            category: course.category,
            estimated_hours: course.estimated_hours,
            module_count: normalizedModules.length,
            modules: normalizedModules,
            createdAt: course.created_at,
        };

        console.log(`✅ [courses/[id]] Returning course with ${normalizedModules.length} modules`);
        return NextResponse.json(response);

    } catch (error: any) {
        console.error('💥 [courses/[id]] Unexpected error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
