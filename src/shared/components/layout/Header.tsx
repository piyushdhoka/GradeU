import React from 'react';
import { User, LogOut, Search } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { Button } from '@components/ui/button';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogoClick = () => {
        if (user) {
            // If logged in, dispatch event to switch to dashboard tab
            window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab: 'dashboard' } }));
        } else {
            // If not logged in, navigate to home
            navigate('/');
        }
    };

    return (
            <header className={`sticky top-0 z-50 w-full border-b border-[#00FF88]/30 bg-black backdrop-blur-xl shadow-lg shadow-[#00FF88]/10 ${className}`}>
                <div className="flex h-16 items-center px-6 gap-4">
                    {/* Logo */}
                    <button
                        onClick={handleLogoClick}
                        className="flex items-center gap-3 mr-6 hover:opacity-80 transition-opacity cursor-pointer"
                    >
                        <img src="/cybercoach-logo.png" alt="Cybercoach" className="h-10 w-10" />
                        <span className="text-xl font-bold bg-linear-to-r from-white to-[#00FF88] bg-clip-text text-transparent hidden sm:inline-block">
                            Cybercoach
                        </span>
                    </button>

                    {/* Search Bar Full Width */}
                    <div className="flex-1 flex items-center">
                        <div className="w-full max-w-2xl">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-[#00FF88]/10 blur-md rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                                <div className="relative flex items-center bg-black/80 rounded-xl border border-[#00FF88]/20 focus-within:border-[#00FF88]/40 focus-within:bg-black/90 transition-all duration-300">
                                    <Search className="h-5 w-5 text-[#00FF88] ml-4" />
                                    <input
                                        type="text"
                                        placeholder="Search courses, labs, or students..."
                                        className="w-full bg-transparent border-none focus:ring-0 text-base px-4 py-3 text-[#00FF88] placeholder:text-[#00FF88]/60"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Info & Logout */}
                    {user && (
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end mr-2">
                                <span className="text-base font-semibold text-[#00FF88]">{user.name}</span>
                                <span className="text-xs text-[#00FF88]/70 capitalize">{user.role}</span>
                            </div>
                            <div className="h-9 w-9 rounded-full border-2 border-[#00FF88]/40 flex items-center justify-center bg-black/80">
                                <User className="h-5 w-5 text-[#00FF88]" />
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
