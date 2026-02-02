"use client";
import { Suspense } from "react";
import { LabsList } from "@student/components/Labs/LabsList";
import { useRouter } from "next/navigation";

function LabsContent() {
    const router = useRouter();

    const handleLabSelect = (labId: string) => {
        router.push(`/labs/${labId}`);
    };

    return <LabsList onLabSelect={handleLabSelect} />;
}

export default function LabsPage() {
    return (
        <Suspense fallback={<div className="p-4">Loading labs...</div>}>
            <LabsContent />
        </Suspense>
    );
}

