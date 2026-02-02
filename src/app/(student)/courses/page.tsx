"use client";
import { Suspense } from "react";
import { CourseList } from "@student/components/Courses/CourseList";
import { useRouter } from "next/navigation";

function CoursesContent() {
    const router = useRouter();

    const handleCourseSelect = (courseId: string) => {
        router.push(`/courses/${courseId}`);
    };

    return <CourseList onCourseSelect={handleCourseSelect} />;
}

export default function CoursesPage() {
    return (
        <Suspense fallback={<div className="p-4">Loading courses...</div>}>
            <CoursesContent />
        </Suspense>
    );
}

