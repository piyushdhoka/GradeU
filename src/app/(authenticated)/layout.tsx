import Sidebar from "@/components/Layout/Sidebar";
import TopBar from "@/components/Layout/TopBar";
import React from "react";
import { redirect } from "next/navigation";
import { getStaffUser } from "@/lib/auth";

export default async function AuthenticatedLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Students (or anyone without a teacher/admin profile) never see teacher pages
    if (!(await getStaffUser())) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
                <TopBar />
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
