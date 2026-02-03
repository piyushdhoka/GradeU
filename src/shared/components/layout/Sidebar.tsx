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
  Shield,
  Users,
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
    { id: 'videos', label: 'Lessons', icon: Video },
  ];

  return (
    <div
      className={cn(
        'sticky top-16 z-30 flex h-[calc(100vh-4rem)] flex-col border-r border-[#00FF88]/10 bg-[#0A0F0A] transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-72'
      )}
    >
      {/* Edge Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="group absolute top-8 -right-3 z-50 rounded-full border border-[#00FF88]/20 bg-[#0A0F0A] p-1.5 text-[#00FF88] shadow-[0_0_10px_rgba(0,255,136,0.2)] transition-all hover:bg-[#00FF88]/10"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 transition-transform group-hover:scale-110" />
        ) : (
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:scale-110" />
        )}
      </button>

      <div
        className={cn(
          'custom-scrollbar flex flex-1 flex-col overflow-y-auto',
          isCollapsed ? 'p-3' : 'p-4'
        )}
      >
        <div className="mt-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'group relative flex w-full items-center overflow-hidden rounded-xl transition-all duration-300',
                  isCollapsed ? 'justify-center px-0 py-3' : 'space-x-3 px-4 py-3.5',
                  isActive
                    ? 'border border-[#00FF88]/20 bg-linear-to-r from-[#00FF88]/20 to-[#00FF88]/5 text-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.15)]'
                    : 'border border-transparent text-[#00B37A] hover:bg-[#00FF88]/5 hover:text-[#EAEAEA] hover:shadow-lg hover:shadow-[#00FF88]/5'
                )}
                title={isCollapsed ? item.label : ''}
              >
                <div
                  className={cn(
                    'rounded-lg p-2 transition-all duration-300',
                    isActive ? 'bg-[#00FF88]/10' : 'bg-[#00FF88]/5 group-hover:bg-[#00FF88]/10'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-transform duration-300 group-hover:scale-110',
                      isActive ? 'text-[#00FF88]' : 'text-[#00B37A] group-hover:text-[#EAEAEA]'
                    )}
                  />
                </div>

                {!isCollapsed && (
                  <span className="overflow-hidden text-sm font-medium tracking-wide whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {isActive && !isCollapsed && (
                  <div className="animate-fade-in absolute right-3">
                    <ChevronRight className="text-primary h-4 w-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 border-t border-[#00FF88]/10 bg-[#0A0F0A]/50 p-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => onTabChange('profile')}
          className={cn(
            'group relative mb-3 flex w-full items-center overflow-hidden rounded-xl transition-all duration-300',
            isCollapsed ? 'justify-center px-0 py-3' : 'space-x-3 px-4 py-3',
            activeTab === 'profile'
              ? 'border border-[#00FF88]/20 bg-linear-to-r from-[#00FF88]/20 to-[#00FF88]/5 text-[#00FF88] shadow-[0_0_20px_rgba(0,255,136,0.15)]'
              : 'border border-transparent text-[#00B37A] hover:bg-[#00FF88]/5 hover:text-[#EAEAEA] hover:shadow-lg hover:shadow-[#00FF88]/5'
          )}
          title={isCollapsed ? 'Profile' : ''}
        >
          <div
            className={cn(
              'rounded-lg p-2 transition-all duration-300',
              activeTab === 'profile'
                ? 'bg-[#00FF88]/10'
                : 'bg-[#00FF88]/5 group-hover:bg-[#00FF88]/10'
            )}
          >
            <User
              className={cn(
                'h-5 w-5 transition-transform duration-300 group-hover:scale-110',
                activeTab === 'profile'
                  ? 'text-[#00FF88]'
                  : 'text-[#00B37A] group-hover:text-[#EAEAEA]'
              )}
            />
          </div>
          {!isCollapsed && (
            <span className="overflow-hidden text-sm font-medium tracking-wide whitespace-nowrap">
              Profile
            </span>
          )}
        </button>

        {!isCollapsed && (
          <button
            type="button"
            onClick={() => onTabChange('pricing')}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded border border-[#00FF88]/20 bg-[#00FF88]/10 px-3 py-2 text-xs font-bold tracking-wide text-[#00FF88] uppercase transition-all hover:bg-[#00FF88]/20"
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
            'group flex w-full cursor-pointer items-center rounded-xl border border-transparent text-[#00B37A] transition-all duration-300 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400',
            isCollapsed ? 'justify-center px-0 py-3' : 'justify-center space-x-2 px-4 py-3'
          )}
          title={isCollapsed ? 'Sign Out' : ''}
        >
          <LogOut className="h-5 w-5 transition-transform group-hover:scale-110" />
          {!isCollapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};
