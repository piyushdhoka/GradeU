"use client";
import { CommunityPage } from "@student/components/Community/CommunityPage";
import { useRouter } from "next/navigation";

export default function CommunityPageRoute() {
    const router = useRouter();

    const handleBack = () => {
        router.push("/dashboard");
    };

    return <CommunityPage onBack={handleBack} />;
}

