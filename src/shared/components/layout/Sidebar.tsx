import React from 'react';
import {
    LayoutDashboard,
    BookOpen,
    Video,
    Terminal,
    User,
    LogOut,
    ChevronRight,
    ChevronLeft,
    ClipboardCheck,
    Shield,
    Users
} from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { cn } from '@lib/utils';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    const { logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'labs', label: 'Labs', icon: Terminal },
        { id: 'community', label: 'Community', icon: Users },
        { id: 'videos', label: 'Videos', icon: Video },
        { id: 'assessment', label: 'Assessment', icon: ClipboardCheck },
    ];


    return (
        <div className={cn(
            "bg-[#0A0F0A] border-r border-[#00FF88]/10 h-[calc(100vh-4rem)] flex flex-col sticky top-16 z-30 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-20" : "w-72"
        )}>
            {/* Edge Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-8 z-50 p-1.5 rounded-full bg-[#0A0F0A] border border-[#00FF88]/20 text-[#00FF88] hover:bg-[#00FF88]/10 transition-all shadow-[0_0_10px_rgba(0,255,136,0.2)] group"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 group-hover:scale-110 transition-transform" />
                ) : (
                    <ChevronLeft className="h-4 w-4 group-hover:scale-110 transition-transform" />
                )}
            </button>

            <div className={cn(
                "flex-1 overflow-y-auto custom-scrollbar flex flex-col",
                isCollapsed ? "p-3" : "p-4"
            )}>
                <div className="space-y-2 mt-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onTabChange(item.id)}
                                className={cn(
                                    "w-full flex items-center rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    isCollapsed ? "justify-center px-0 py-3" : "space-x-3 px-4 py-3.5",
                                    isActive
                                        ? 'bg-linear-to-r from-[#00FF88]/20 to-[#00FF88]/5 text-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.15)] border border-[#00FF88]/20'
                                        : 'text-[#00B37A] hover:text-[#EAEAEA] hover:bg-[#00FF88]/5 border border-transparent hover:shadow-lg hover:shadow-[#00FF88]/5'
                                )}
                                title={isCollapsed ? item.label : ""}
                            >
                                <div className={cn(
                                    "p-2 rounded-lg transition-all duration-300",
                                    isActive ? "bg-[#00FF88]/10" : "bg-[#00FF88]/5 group-hover:bg-[#00FF88]/10"
                                )}>
                                    <Icon className={cn(
                                        "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                                        isActive ? "text-[#00FF88]" : "text-[#00B37A] group-hover:text-[#EAEAEA]"
                                    )} />
                                </div>

                                {!isCollapsed && <span className="font-medium tracking-wide text-sm whitespace-nowrap overflow-hidden">{item.label}</span>}

                                {isActive && !isCollapsed && (
                                    <div className="absolute right-3 animate-fade-in">
                                        <ChevronRight className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 border-t border-[#00FF88]/10 bg-[#0A0F0A]/50 backdrop-blur-sm relative z-10">
                <button
                    type="button"
                    onClick={() => onTabChange('profile')}
                    className={cn(
                        "w-full mb-3 flex items-center rounded-xl transition-all duration-300 group relative overflow-hidden",
                        isCollapsed ? "justify-center px-0 py-3" : "space-x-3 px-4 py-3",
                        activeTab === 'profile'
                            ? 'bg-linear-to-r from-[#00FF88]/20 to-[#00FF88]/5 text-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.15)] border border-[#00FF88]/20'
                            : 'text-[#00B37A] hover:text-[#EAEAEA] hover:bg-[#00FF88]/5 border border-transparent hover:shadow-lg hover:shadow-[#00FF88]/5'
                    )}
                    title={isCollapsed ? "Profile" : ""}
                >
                    <div className={cn(
                        "p-2 rounded-lg transition-all duration-300",
                        activeTab === 'profile' ? "bg-[#00FF88]/10" : "bg-[#00FF88]/5 group-hover:bg-[#00FF88]/10"
                    )}>
                        <User className={cn(
                            "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                            activeTab === 'profile' ? "text-[#00FF88]" : "text-[#00B37A] group-hover:text-[#EAEAEA]"
                        )} />
                    </div>
                    {!isCollapsed && <span className="font-medium tracking-wide text-sm whitespace-nowrap overflow-hidden">Profile</span>}
                </button>

                {!isCollapsed && (
                    <button
                        type="button"
                        onClick={() => onTabChange('pricing')}
                        className="w-full mb-3 bg-[#00FF88]/10 hover:bg-[#00FF88]/20 text-[#00FF88] text-xs font-bold py-2 px-3 rounded border border-[#00FF88]/20 transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                    >
                        <Shield className="h-3 w-3" />
                        Upgrade to Pro
                    </button>
                )}

                <button
                    type="button"
                    onClick={async () => {
                        try {
                            await logout();
                        } catch (error) {
                            console.error('Logout failed:', error);
                        }
                    }}
                    className={cn(
                        "w-full flex items-center rounded-xl text-[#00B37A] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300 group cursor-pointer",
                        isCollapsed ? "justify-center px-0 py-3" : "justify-center space-x-2 px-4 py-3"
                    )}
                    title={isCollapsed ? "Sign Out" : ""}
                >
                    <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    {!isCollapsed && <span className="font-medium">Sign Out</span>}
                </button>
            </div>
        </div>
    );
};
