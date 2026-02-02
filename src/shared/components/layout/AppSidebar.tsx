import * as React from "react"
import {
    LayoutDashboard,
    BookOpen,
    Terminal,
    Video,
    User,
    LogOut,
    ChevronRight,
    Bug,
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"

import { useAuth } from "@context/AuthContext"
import { BugReportModal } from "@student/components/Support/BugReportModal"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@shared/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    activeTab: string
    onTabChange: (tab: string) => void
}

export function AppSidebar({ activeTab, onTabChange, ...props }: AppSidebarProps) {
    const { logout } = useAuth()
    const router = useRouter()
    const [isBugModalOpen, setIsBugModalOpen] = React.useState(false)

    const handleNavigation = (tab: string) => {
        onTabChange(tab);
    }

    const navMain = [
        {
            title: "Navigation",
            items: [
                {
                    title: "Dashboard",
                    id: "dashboard",
                    icon: LayoutDashboard,
                },
                {
                    title: "Courses",
                    id: "courses",
                    icon: BookOpen,
                },
                {
                    title: "Practice Labs",
                    id: "labs",
                    icon: Terminal,
                },
            ],
        },
        {
            title: "Community",
            items: [

                {
                    title: "Lessons",
                    id: "videos",
                    icon: Video,
                },
            ],
        },
        {
            title: "Account",
            items: [
                {
                    title: "Profile",
                    id: "profile",
                    icon: User,
                },
            ],
        },
    ]

    return (
        <Sidebar collapsible="icon" {...props} className="border-r border-sidebar-border/50">
            <SidebarHeader className="h-20 border-b border-sidebar-border/50" />
            <SidebarContent>
                {navMain.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            isActive={activeTab === item.id}
                                            onClick={() => handleNavigation(item.id)}
                                            className={activeTab === item.id ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}
                                        >
                                            <item.icon className="size-4 shrink-0 transition-all duration-200 group-data-[state=collapsed]:mx-auto" />
                                            <span className="transition-opacity duration-200 group-data-[state=collapsed]:hidden truncate">
                                                {item.title}
                                            </span>
                                            {activeTab === item.id && (
                                                <ChevronRight className="ml-auto size-3 opacity-50 transition-opacity duration-200 group-data-[state=collapsed]:hidden" />
                                            )}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => setIsBugModalOpen(true)}
                                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                >
                                    <Bug className="size-4 shrink-0 transition-all duration-200 group-data-[state=collapsed]:mx-auto" />
                                    <span className="transition-opacity duration-200 group-data-[state=collapsed]:hidden">
                                        Report a Bug
                                    </span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={async () => {
                                        try {
                                            await logout()
                                            router.push("/")
                                        } catch (error) {
                                            console.error("Logout failed:", error)
                                        }
                                    }}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                >
                                    <LogOut className="size-4 shrink-0 transition-all duration-200 group-data-[state=collapsed]:mx-auto" />
                                    <span className="transition-opacity duration-200 group-data-[state=collapsed]:hidden">
                                        Sign Out
                                    </span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarFooter>
            <SidebarRail />
            <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />
        </Sidebar>
    )
}
