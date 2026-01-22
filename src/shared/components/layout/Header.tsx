import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { Button } from '@components/ui/button';

interface HeaderProps {
    className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className }) => {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <header className={`w-full border-b border-white/5 bg-black ${className}`}>
            <div className="flex h-12 items-center justify-end px-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                        try {
                            await logout();
                        } catch (error) {
                            console.error('Logout failed:', error);
                        }
                    }}
                    className="text-white hover:bg-white/5 px-2 flex items-center gap-2"
                >
                    <span className="text-xs uppercase tracking-widest">Sign Out</span>
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </header>
    );
};
