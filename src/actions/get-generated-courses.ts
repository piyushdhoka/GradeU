"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface GeneratedCourse {
    id: string;
    title: string;
    description: string;
    created_at: string;
    created_by?: string | null; // Added field for teacher name
    is_published: boolean;
    modules: GeneratedModule[];
}

export interface GeneratedModule {
    id: string;
    title: string;
    module_order: number;
    topics: { name: string; path: string }[];
    quiz: GeneratedQuiz[];
}

export interface GeneratedQuiz {
    id: string;
    question: string;
    options: string[];
    correct_option: number;
}

export async function getGeneratedCourses(): Promise<GeneratedCourse[]> {
    try {
        // 1. Fetch Courses with Creator Name
        const { data: courses, error: coursesError } = await supabaseAdmin
            .from("courses")
            .select(`
                id, 
                title, 
                description, 
                created_at,
                is_published,
                created_by
            `)
            .order("created_at", { ascending: false });

        console.log("Fetching courses...");
        if (coursesError) {
            console.error("Supabase Error fetching courses:", coursesError);
            return [];
        }
        console.log(`Found ${courses ? courses.length : 0} courses.`);
        if (courses && courses.length > 0) {
            console.log("First course sample:", courses[0]);
        }

        if (!courses) {
            return [];
        }

        const result: GeneratedCourse[] = [];

        // Collect all unique user IDs to fetch teacher details
        const userIds = Array.from(new Set(courses.map(c => c.created_by).filter(Boolean)));

        let teacherMap: Record<string, string> = {};

        if (userIds.length > 0) {
            const { data: teachers, error: teachersError } = await supabaseAdmin
                .from('teacher_details')
                .select('id, teacher_name')
                .in('id', userIds);

            if (teachersError) {
                console.error("Error fetching teacher details:", teachersError);
            } else if (teachers) {
                teacherMap = teachers.reduce((acc, t) => {
                    acc[t.id] = t.teacher_name;
                    return acc;
                }, {} as Record<string, string>);
            }
        }

        for (const course of courses) {
            // ... (Modules Logic remains same)
            // 2. Fetch Modules for each course
            const { data: modules, error: modulesError } = await supabaseAdmin
                .from("modules")
                .select("id, title, module_order, topics")
                .eq("course_id", course.id)
                .order("module_order", { ascending: true });

            if (modulesError) {
                console.error(`Error fetching modules for course ${course.id}:`, modulesError);
                continue;
            }

            const courseModules: GeneratedModule[] = [];

            if (modules) {
                for (const module of modules) {
                    // 3. Fetch Quizzes for each module
                    const { data: quizzes, error: quizzesError } = await supabaseAdmin
                        .from("quizzes")
                        .select("id, question, options, correct_option")
                        .eq("module_id", module.id);

                    if (quizzesError) {
                        console.error(`Error fetching quizzes for module ${module.id}:`, quizzesError);
                    }

                    courseModules.push({
                        id: module.id,
                        title: module.title,
                        module_order: module.module_order,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        topics: (module.topics as any[]) || [], // Type assertion for JSON
                        quiz: quizzes || []
                    });
                }
            }

            // Resolve Teacher Name
            const teacherId = course.created_by;
            const teacherName = teacherMap[teacherId] || "Unknown Teacher";

            result.push({
                id: course.id,
                title: course.title,
                description: course.description || "",
                created_at: course.created_at,
                created_by: teacherName,
                is_published: course.is_published,
                modules: courseModules
            });
        }

        return result;

    } catch (error) {
        console.error("Unexpected error in getGeneratedCourses:", error);
        return [];
    }
}
