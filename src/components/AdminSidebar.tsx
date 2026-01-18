import React from 'react';
import {
    LayoutDashboard,
    Users,
    BookOpen,
    BarChart,
    LogOut,
    ChevronRight,
    ChevronLeft,
    Settings,
    Shield
} from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { cn } from '@lib/utils';

interface AdminSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange }) => {
    const { logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'Manage Users', icon: Users },
        { id: 'courses', label: 'Manage Courses', icon: BookOpen },
        { id: 'analytics', label: 'Analytics', icon: BarChart },
        { id: 'settings', label: 'Settings', icon: Settings },
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
                                        ? 'bg-gradient-to-r from-[#00FF88]/20 to-[#00FF88]/5 text-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.15)] border border-[#00FF88]/20'
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
                {!isCollapsed && (
                    <div className="mb-4 px-4 py-3 bg-gradient-to-br from-[#0A0F0A] to-[#000000] rounded-xl border border-[#00FF88]/10 shadow-inner">
                        <p className="text-xs font-medium text-[#00B37A] uppercase tracking-wider mb-2">Clearance Level</p>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-2xl font-bold text-[#EAEAEA]">
                                    Administrator
                                </p>
                                <p className="text-xs text-[#00FF88]">
                                    Level 5 Access
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                <Shield className="h-5 w-5 text-red-400" />
                            </div>
                        </div>
                    </div>
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
                        "w-full flex items-center rounded-xl text-[#00B37A] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500",
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
