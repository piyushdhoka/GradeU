"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getStaffUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function publishCourse(courseId: string) {
    if (!(await getStaffUser())) {
        return { success: false, error: "Teacher access required" };
    }

    try {
        const { error } = await supabaseAdmin
            .from("courses")
            .update({ is_published: true })
            .eq("id", courseId);

        if (error) {
            console.error("Error publishing course:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/generated-courses");
        return { success: true };
    } catch (error: any) {
        console.error("Unexpected error publishing course:", error);
        return { success: false, error: error.message };
    }
}
