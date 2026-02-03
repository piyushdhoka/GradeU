"use client";

import GeneratedCoursesSection from '@/components/GeneratedCoursesSection';

export default function GeneratedCoursesPage() {
    return (
        <div className="p-8 space-y-8">
            <div className="mb-8">
                <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Generated Courses</h1>
                <p className="text-zinc-500 dark:text-slate-400 mt-2 font-medium">Manage and view your AI-generated courses.</p>
            </div>
            <GeneratedCoursesSection />
        </div>
    );
}
