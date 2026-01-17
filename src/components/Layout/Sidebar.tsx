"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Users, LogOut } from 'lucide-react';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Generate Course', href: '/generate', icon: BookOpen },
    { name: 'Students', href: '/students', icon: Users },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">EduGen AI</span>
                </div>

                <nav className="space-y-1.5">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                                    ? 'bg-blue-600/10 text-blue-500 shadow-sm'
                                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-zinc-500'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-zinc-800">
                <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-semibold text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200">
                    <LogOut className="w-5 h-5 text-zinc-500" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
