"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface GeneratedCourse {
    id: string;
    title: string;
    description: string;
    created_at: string;
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
        // 1. Fetch Courses
        const { data: courses, error: coursesError } = await supabaseAdmin
            .from("courses")
            .select("id, title, description, created_at")
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (coursesError || !courses) {
            console.error("Error fetching courses:", coursesError);
            return [];
        }

        const result: GeneratedCourse[] = [];

        for (const course of courses) {
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

            result.push({
                id: course.id,
                title: course.title,
                description: course.description || "",
                created_at: course.created_at,
                modules: courseModules
            });
        }

        return result;

    } catch (error) {
        console.error("Unexpected error in getGeneratedCourses:", error);
        return [];
    }
}
