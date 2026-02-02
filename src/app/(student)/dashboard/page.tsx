"use client";
import { Dashboard } from "@student/components/Dashboard/Dashboard";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();

    const handleTabChange = (tab: string) => {
        // Handle direct paths like 'courses/id'
        if (tab.startsWith('courses/')) {
            router.push(`/${tab}`);
            return;
        }

        const routes: Record<string, string> = {
            courses: "/courses",
            labs: "/labs",
            videos: "/videos",
            certificates: "/certificates",
            profile: "/profile",
            community: "/community",
            "proctor-demo": "/proctor-demo",
        };
        const route = routes[tab] || "/dashboard";
        router.push(route);
    };

    return <Dashboard onTabChange={handleTabChange} />;
}

