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
        <header className={`sticky top-0 z-50 w-full border-b border-brand-400/10 bg-black/90 backdrop-blur-xl ${className}`}>
            <div className="flex h-20 items-center px-8 gap-4">
                {/* Logo */}
                <button
                    onClick={handleLogoClick}
                    className="flex items-center gap-4 mr-8 hover:opacity-90 transition-opacity cursor-pointer"
                >
                    <img src="/logo.svg" alt="GradeU" className="h-14 w-14" />
                    <span className="text-3xl font-black tracking-tight text-white hidden sm:inline-block font-display uppercase">
                        Grade<span className="text-brand-400">U</span>
                    </span>
                </button>

                {/* Search Bar Full Width */}
                <div className="flex-1 flex items-center">
                    <div className="w-full max-w-2xl">
                        <div className="relative group">
                            <div className="relative flex items-center bg-zinc-900/50 rounded-2xl border border-white/5 focus-within:border-brand-400/30 transition-all duration-300">
                                <Search className="h-5 w-5 text-zinc-500 ml-4 group-focus-within:text-brand-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search courses, labs, or students..."
                                    className="w-full bg-transparent border-none focus:ring-0 text-base px-4 py-4 text-white placeholder:text-zinc-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Info & Logout */}
                {user && (
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-base font-bold text-white">{user.name}</span>
                            <span className="text-[10px] text-brand-400 uppercase tracking-widest font-bold">{user.role}</span>
                        </div>
                        <div className="h-11 w-11 rounded-full border border-white/10 flex items-center justify-center bg-zinc-900 group relative cursor-pointer overflow-hidden transition-all hover:border-brand-400/40">
                            <User className="h-6 w-6 text-zinc-400 group-hover:text-brand-400 transition-colors" />
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
                            className="text-[#00FF88] hover:text-destructive hover:bg-destructive/10"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>
        </header>
    );
};
