"use client";

import { LogOut, UserCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function TopBar() {
    return (
        <header className="h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex-1" /> {/* Spacer since search is removed */}

            <div className="flex items-center gap-4">
                <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
                >
                    <UserCircle2 className="w-5 h-5" />
                    <span>Profile</span>
                </Link>

                <div className="h-4 w-px bg-zinc-800" />

                <button
                    onClick={async () => {
                        const { supabase } = await import('@/lib/supabaseClient');
                        await supabase.auth.signOut();
                        window.location.href = '/';
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                </button>
            </div>
        </header>
    );
}
