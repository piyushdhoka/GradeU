"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getStaffUser } from "@/lib/auth";

export interface ActivityItem {
    id: string;
    type: "enrollment" | "module" | "quiz" | "lab" | "course_created" | "login";
    studentName: string;
    description: string;
    timeAgo: string;
    timestamp: Date;
}

function timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
    if (!(await getStaffUser())) return [];

    try {
        const activities: ActivityItem[] = [];

        // 1. Fetch recent enrollments
        const { data: enrollments } = await supabaseAdmin
            .from("enrollments")
            .select("id, student_id, enrolled_at, courses(title)")
            .order("enrolled_at", { ascending: false })
            .limit(5);

        if (enrollments) {
            for (const e of enrollments) {
                // @ts-ignore - Supabase type inference might differ slightly
                const courseTitle = e.courses?.title || "a course";
                activities.push({
                    id: `enroll-${e.id}`,
                    type: "enrollment",
                    studentName: e.student_id, // Placeholder, will resolve names later
                    description: `enrolled in "${courseTitle}"`,
                    timestamp: new Date(e.enrolled_at),
                    timeAgo: timeAgo(new Date(e.enrolled_at)),
                });
            }
        }

        // 2. Fetch recent module completions
        const { data: moduleCompletions } = await supabaseAdmin
            .from("module_progress")
            .select("id, student_id, completed_at, modules(title)")
            .eq("completed", true)
            .order("completed_at", { ascending: false })
            .limit(5);

        if (moduleCompletions) {
            for (const m of moduleCompletions) {
                // @ts-ignore
                const moduleTitle = m.modules?.title || "a module";
                activities.push({
                    id: `mod-${m.id}`,
                    type: "module",
                    studentName: m.student_id,
                    description: `completed module "${moduleTitle}"`,
                    timestamp: new Date(m.completed_at),
                    timeAgo: timeAgo(new Date(m.completed_at)),
                });
            }
        }

        // 3. Fetch recent quiz attempts (passed)
        const { data: quizAttempts } = await supabaseAdmin
            .from("quiz_attempts")
            .select("id, student_id, completed_at, score, modules(title)")
            .order("completed_at", { ascending: false })
            .limit(5);

        if (quizAttempts) {
            for (const q of quizAttempts) {
                // @ts-ignore
                const moduleTitle = q.modules?.title || "a quiz";
                activities.push({
                    id: `quiz-${q.id}`,
                    type: "quiz",
                    studentName: q.student_id,
                    description: `scored ${q.score}% on "${moduleTitle}" quiz`,
                    timestamp: new Date(q.completed_at),
                    timeAgo: timeAgo(new Date(q.completed_at)),
                });
            }
        }

        // 4. Fetch recent logins (from auth.users)
        const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (!usersError && users) {
            // Filter users who have logged in recently
            const recentLogins = users
                .filter(u => u.last_sign_in_at)
                .sort((a, b) => new Date(b.last_sign_in_at!).getTime() - new Date(a.last_sign_in_at!).getTime())
                .slice(0, 5);

            for (const u of recentLogins) {
                if (u.last_sign_in_at) {
                    activities.push({
                        id: `login-${u.id}-${u.last_sign_in_at}`,
                        type: "login",
                        studentName: u.id, // Placeholder
                        description: `logged in`,
                        timestamp: new Date(u.last_sign_in_at),
                        timeAgo: timeAgo(new Date(u.last_sign_in_at)),
                    });
                }
            }
        }

        // Sort combined activities
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const topActivities = activities.slice(0, 10);

        // Resolve User Names exactly for the top activities
        const userIds = [...new Set(topActivities.map((a) => a.studentName))];
        const { data: profiles } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);

        const nameMap = new Map<string, string>();
        profiles?.forEach((p) => {
            nameMap.set(p.id, p.full_name || "Unknown User");
        });

        // Update names
        topActivities.forEach((activity) => {
            activity.studentName = nameMap.get(activity.studentName) || "Unknown User";
        });

        return topActivities;
    } catch (error) {
        console.error("Error fetching dashboard activity:", error);
        return [];
    }
}
