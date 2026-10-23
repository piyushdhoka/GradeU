"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getStaffUser } from "@/lib/auth";

export interface StudentData {
    id: string; // purely visual ID for list key or map, or we can use the uuid
    uuid: string;
    name: string;
    email: string;
    course: string;
    progress: number;
    testScore: number;
    status: "Active" | "Completed" | "Behind";
    modules: string; // Format "X/Y"
}

export async function getStudents(): Promise<StudentData[]> {
    if (!(await getStaffUser())) return [];

    try {
        // 1. Fetch all profiles with role 'student'
        const { data: profiles, error: profilesError } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name")
            .eq("role", "student");

        if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
            return [];
        }

        if (!profiles || profiles.length === 0) {
            return [];
        }

        // 2. Fetch all users to map emails (Admin only)
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (usersError) {
            console.error("Error fetching users:", usersError);
            // Continue without emails if strict fetching fails, or handle appropriately
        }

        const emailMap = new Map<string, string>();
        users?.forEach((user) => {
            emailMap.set(user.id, user.email || "");
        });

        // 3. Process each student to get their course details
        const studentsData: StudentData[] = [];

        // Use a loop or Promise.all to fetch details for each student
        // For scalability with thousands of users, this would need optimization (one big query with joins),
        // but for now, we iterate as per the schema constraints and expected load.

        await Promise.all(
            profiles.map(async (profile, index) => {
                const studentId = profile.id;
                const email = emailMap.get(studentId) || "No Email";
                const name = profile.full_name || "Unknown Name";

                // Get latest enrollment
                const { data: enrollments } = await supabaseAdmin
                    .from("enrollments")
                    .select("course_id, enrolled_at")
                    .eq("student_id", studentId)
                    .order("enrolled_at", { ascending: false })
                    .limit(1);

                let courseName = "Not Enrolled";
                let progress = 0;
                let testScore = 0;
                let completedModulesCount = 0;
                let totalModulesCount = 0;
                let status: StudentData["status"] = "Active";

                if (enrollments && enrollments.length > 0) {
                    const courseId = enrollments[0].course_id;

                    // Get Course Name
                    const { data: course } = await supabaseAdmin
                        .from("courses")
                        .select("title")
                        .eq("id", courseId)
                        .single();

                    if (course) {
                        courseName = course.title;
                    }

                    // Get Total Modules for this course
                    const { count: totalModules } = await supabaseAdmin
                        .from("modules")
                        .select("*", { count: "exact", head: true })
                        .eq("course_id", courseId);

                    totalModulesCount = totalModules || 0;

                    // Get Completed Modules
                    // We need to join module_progress with modules to ensure we count only modules for THIS course
                    // OR we first get the module IDs for the course
                    const { data: courseModules } = await supabaseAdmin
                        .from('modules')
                        .select('id')
                        .eq('course_id', courseId)

                    if (courseModules && courseModules.length > 0) {
                        const moduleIds = courseModules.map(m => m.id);

                        const { count: completedCount } = await supabaseAdmin
                            .from("module_progress")
                            .select("*", { count: "exact", head: true })
                            .eq("student_id", studentId)
                            .in("module_id", moduleIds)
                            .eq("completed", true);

                        completedModulesCount = completedCount || 0;
                    }

                    // Calculate Progress
                    if (totalModulesCount > 0) {
                        progress = Math.round((completedModulesCount / totalModulesCount) * 100);
                    }

                    if (progress === 100) status = "Completed";
                    else if (progress < 20 && totalModulesCount > 5) status = "Behind"; // Arbitrary logic for "Behind"
                }

                // Get Quiz Scores
                const { data: quizAttempts } = await supabaseAdmin
                    .from("quiz_attempts")
                    .select("score")
                    .eq("student_id", studentId);

                if (quizAttempts && quizAttempts.length > 0) {
                    // Average score
                    const totalScore = quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
                    testScore = Math.round(totalScore / quizAttempts.length);
                }

                studentsData.push({
                    id: (index + 1).toString(), // Maintaining the existing numeric ID style if UI depends on it, but UUID is safer
                    uuid: studentId,
                    name,
                    email,
                    course: courseName,
                    progress,
                    testScore,
                    status,
                    modules: `${completedModulesCount}/${totalModulesCount}`,
                });
            })
        );

        return studentsData;
    } catch (error) {
        console.error("Unexpected error in getStudents:", error);
        return [];
    }
}
