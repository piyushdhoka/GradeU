"use client";
import { use } from "react";
import { CourseDetail } from "@student/components/Courses/CourseDetail";
import { useRouter } from "next/navigation";

function CourseDetailContent({ courseId }: { courseId: string }) {
    const router = useRouter();

    const handleBack = () => {
        router.push("/courses");
    };

    return <CourseDetail courseId={courseId} onBack={handleBack} />;
}

export default function CourseDetailPage({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = use(params);
    
    return <CourseDetailContent courseId={courseId} />;
}

