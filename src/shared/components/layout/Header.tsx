import React from 'react';
import { User, LogOut, Search } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { Button } from '@components/ui/button';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogoClick = () => {
    if (user) {
      // If logged in, dispatch event to switch to dashboard tab
      window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 'dashboard' } }));
    } else {
      // If not logged in, navigate to home
      router.push('/');
    }
  };

  return (
    <header
      className={`border-brand-400/10 sticky top-0 z-50 w-full border-b bg-black/90 backdrop-blur-xl ${className}`}
    >
      <div className="flex h-20 items-center gap-4 px-8">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="mr-8 flex cursor-pointer items-center gap-4 transition-opacity hover:opacity-90"
        >
          <img src="/logo.svg" alt="GradeU" className="h-14 w-14" />
          <span className="font-display hidden text-3xl font-black tracking-tight text-white uppercase sm:inline-block">
            Grade<span className="text-brand-400">U</span>
          </span>
        </button>

        {/* Search Bar Full Width */}
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-2xl">
            <div className="group relative">
              <div className="focus-within:border-brand-400/30 relative flex items-center rounded-2xl border border-white/5 bg-zinc-900/50 transition-all duration-300">
                <Search className="group-focus-within:text-brand-400 ml-4 h-5 w-5 text-zinc-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search courses, labs, or students..."
                  className="w-full border-none bg-transparent px-4 py-4 text-base text-white placeholder:text-zinc-600 focus:ring-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Info & Logout */}
        {user && (
          <div className="flex items-center gap-6">
            <div className="mr-2 flex flex-col items-end">
              <span className="text-base font-bold text-white">{user.name}</span>
              <span className="text-brand-400 text-[10px] font-bold tracking-widest uppercase">
                {user.role}
              </span>
            </div>
            <div className="group hover:border-brand-400/40 relative flex h-11 w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-900 transition-all">
              <User className="group-hover:text-brand-400 h-6 w-6 text-zinc-400 transition-colors" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                try {
                  await logout();
                } catch (error) {
                  console.error('Logout failed:', error);
                }
              }}
              className="hover:text-destructive hover:bg-destructive/10 text-[#00FF88]"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
