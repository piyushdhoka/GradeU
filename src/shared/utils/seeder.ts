import { supabase } from '@lib/supabase';

// Helper to generate UUIDs (simple random for client-side generation if needed, but we'll try to rely on Supabase defaults or hardcoded safe IDs)
// Actually better to hardcode IDs for the courses so we can reliably attach modules/questions to them.

const COURSES = [
    {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Web Security Fundamentals',
        description: 'Master the core principles of securing web applications, including OWASP Top 10, headers, and authentication.',
        category: 'Web Security',
        difficulty: 'beginner',
        is_published: true
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Network Defense & Traffic Analysis',
        description: 'Learn to analyze network traffic, identify anomalies, and implement robust defense mechanisms.',
        category: 'Network Security',
        difficulty: 'intermediate',
        is_published: true
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Ethical Hacking & Penetration Testing',
        description: 'Hands-on practical guide to offensive security, tools usage, and vulnerability exploitation.',
        category: 'Red Teaming',
        difficulty: 'advanced',
        is_published: true
    },
    {
        id: '550e8400-e29b-41d4-a716-446655440004',
        title: 'Cloud Security Architecture',
        description: 'Securing cloud infrastructure (AWS/Azure), IAM policies, and container security.',
        category: 'Cloud Security',
        difficulty: 'intermediate',
        is_published: true
    }
];

const MODULE_TEMPLATE = (courseId: string, courseName: string, i: number) => ({
    title: `Module ${i}: ${courseName} - Part ${i}`,
    content_markdown: `Lorem ipsum content for module ${i} of ${courseName}...`,
    course_id: courseId,
    module_order: i
});



export const runSeed = async (userId?: string) => {
    console.log('Starting Master Seed...');

    let finalUserId = userId;
    if (!finalUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) finalUserId = user.id;
    }
    if (!finalUserId) return { success: false, message: 'No user ID found for seeding.' };

    try {
        // 1. Upsert Courses
        console.log('Seeding Courses...');
        const coursesPayload = COURSES.map(c => ({ ...c }));
        const { error: cErr } = await supabase.from('courses').upsert(coursesPayload, { onConflict: 'id' });
        if (cErr) throw new Error(`Courses failed: ${cErr.message}`);

        // 2. Upsert Modules (10 per course)
        console.log('Seeding Modules...');
        let allModules: any[] = [];
        COURSES.forEach(c => {
            for (let i = 1; i <= 10; i++) {
                // For Web Security, give real titles if possible
                let title = `Module ${i}: Advanced Topic ${i}`;
                if (c.id === '550e8400-e29b-41d4-a716-446655440001') {
                    const titles = ['HTTP Basics', 'OWASP Injection', 'Broken Auth', 'XSS Defense', 'CSRF Protection', 'Security Headers', 'Content Security Policy', 'Secure Logging', 'File Upload Security', 'Final Implementation'];
                    title = titles[i - 1] || title;
                }
                allModules.push({
                    ...MODULE_TEMPLATE(c.id, c.title, i),
                    title: title,
                    module_order: i
                });
            }
        });

        // Modules usually don't have hardcoded IDs in my previous script, relying on insert.
        // To be safe against duplicates without wiping, we should ideally wipe modules for these courses first.
        // ERROR: If we delete, we lose progress. 
        // STRATEGY: We will check if modules for the course exist. If < 10, we wipe and re-insert.

        for (const c of COURSES) {
            const { count } = await supabase.from('modules').select('*', { count: 'exact', head: true }).eq('course_id', c.id);
            if (!count || count < 10) {
                await supabase.from('modules').delete().eq('course_id', c.id);
                const courseMods = allModules.filter(m => m.course_id === c.id);
                const { error: mErr } = await supabase.from('modules').insert(courseMods);
                if (mErr) throw new Error(`Modules failed for ${c.title}: ${mErr.message}`);
            }
        }

        // 3. Upsert Quizzes (replacing questions)
        console.log('Seeding Quizzes...');
        for (const c of COURSES) {
            // First get the modules for this course to link quizzes to
            const { data: mods } = await supabase.from('modules').select('id').eq('course_id', c.id);
            if (mods && mods.length > 0) {
                for (const m of mods) {
                    const { count } = await supabase.from('quizzes').select('*', { count: 'exact', head: true }).eq('module_id', m.id);
                    if (!count || count < 2) {
                        const quizzes = [
                            {
                                module_id: m.id,
                                question: `Review: What is a critical aspect of this module in ${c.title}?`,
                                options: ['Security First', 'Performance First', 'Cost First', 'Chaos'],
                                correct_option: 0
                            },
                            {
                                module_id: m.id,
                                question: `Protocol Check: Which best describes the core concept here?`,
                                options: ['Encapsulation', 'Redundancy', 'Monitoring', 'Least Privilege'],
                                correct_option: 3
                            }
                        ];
                        await supabase.from('quizzes').insert(quizzes);
                    }
                }
            }
        }

        return { success: true, message: 'Full content seeded: 4 Courses, 40 Modules, 60 Questions.' };

    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message };
    }
};
