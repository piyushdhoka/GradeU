"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export interface GeneratedCourse {
    id: string;
    title: string;
    description: string;
    created_at: string;
    created_by?: string | null; // Added field for teacher name
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
                profiles:profiles!courses_created_by_fkey (
                    teacher_details (
                        teacher_name
                    )
                )
            `) // Join: courses -> profiles -> teacher_details
            .eq("is_published", true)
            .order("created_at", { ascending: false });

        if (coursesError || !courses) {
            console.error("Error fetching courses:", coursesError);
            return [];
        }

        const result: GeneratedCourse[] = [];

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

            // Extract teacher name from the nested join
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const profileData = course.profiles as any;
            // Access teacher_details which might be an object or array depending on relation (usually object for 1:1)
            const teacherDetails = profileData?.teacher_details;
            // Handle if it's an array (sometimes PostgREST returns array for 1:1 if not specified) or object
            const teacherName = Array.isArray(teacherDetails)
                ? teacherDetails[0]?.teacher_name
                : teacherDetails?.teacher_name;

            result.push({
                id: course.id,
                title: course.title,
                description: course.description || "",
                created_at: course.created_at,
                created_by: teacherName || "Unknown Teacher", // Fallback
                modules: courseModules
            });
        }

        return result;

    } catch (error) {
        console.error("Unexpected error in getGeneratedCourses:", error);
        return [];
    }
}
