"use server";

import { getStaffUser } from "@/lib/auth";

export async function checkStaffAccess(): Promise<boolean> {
    return (await getStaffUser()) !== null;
}
