"use client";
import { useAuth } from "@context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarInset, SidebarProvider } from "@shared/components/ui/sidebar";
import { AppSidebar } from "@shared/components/layout/AppSidebar";
import { DashboardHeader } from "@shared/components/layout/DashboardHeader";
import { StickyBanner } from "@shared/components/ui/sticky-banner";
import { usePathname } from "next/navigation";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-400 mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const getActiveTab = () => {
        if (pathname?.startsWith("/courses")) return "courses";
        if (pathname?.startsWith("/labs")) return "labs";
        if (pathname?.startsWith("/videos")) return "videos";
        if (pathname?.startsWith("/certificates")) return "certificates";
        if (pathname?.startsWith("/profile")) return "profile";
        if (pathname?.startsWith("/community")) return "community";
        if (pathname?.startsWith("/proctor-demo")) return "proctor-demo";
        return "dashboard";
    };

    const activeTab = getActiveTab();

    const handleTabChange = (tab: string) => {
        const routes: Record<string, string> = {
            dashboard: "/dashboard",
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

    if (pathname === "/community") {
        return <main className="min-h-screen">{children}</main>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* 1. Header Banner - Fixed Height 44px (11) */}
            <div className="fixed top-0 left-0 right-0 z-100 h-11 border-b border-white/10 bg-blue-600 overflow-hidden">
                <StickyBanner className="h-full border-none flex items-center justify-center p-0">
                    <p className="text-[11px] font-bold text-white tracking-widest uppercase font-display px-4">
                        Announcing the GradeU Community. Connect with fellow students and share knowledge.{" "}
                        <button
                            onClick={() => router.push("/community")}
                            className="bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded ml-2 font-black transition-colors"
                        >
                            JOIN COMMUNITY &rarr;
                        </button>
                    </p>
                </StickyBanner>
            </div>

            {/* 2. Main Layout Container - Shifted down by Banner (44px) */}
            <div className="flex flex-1 pt-11">
                <SidebarProvider className="dark w-full bg-background text-foreground">
                    <AppSidebar
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        className="top-11! h-[calc(100vh-2.75rem)]! z-50!"
                    />
                    <SidebarInset className="flex flex-col flex-1 relative min-h-0">
                        {/* Dashboard Header - Sticky within its container, sitting below banner */}
                        <div className="sticky top-11 z-40 bg-background/95 backdrop-blur-sm">
                            <DashboardHeader activeTab={activeTab} onTabChange={handleTabChange} />
                        </div>

                        {/* Page Content */}
                        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
                            {children}
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </div>
        </div>
    );
}
