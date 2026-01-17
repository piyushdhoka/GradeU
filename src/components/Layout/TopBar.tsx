"use client";

import { Bell, Search, UserCircle2 } from 'lucide-react';

export default function TopBar() {
    return (
        <header className="h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-10">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl w-96 transition-all focus-within:border-blue-500/50">
                <Search className="w-4 h-4 text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search for courses, students..."
                    className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full text-zinc-200 placeholder-zinc-600"
                />
            </div>

            <div className="flex items-center gap-6">
                <button className="relative text-zinc-400 hover:text-blue-500 transition-all duration-200">
                    <Bell className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-zinc-950">
                        3
                    </span>
                </button>

                <div className="flex items-center gap-4 pl-6 border-l border-zinc-800 text-zinc-300">
                    <div className="text-right">
                        <p className="text-sm font-bold text-white leading-none">Prof. Vedant</p>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold tracking-widest">Senior Instructor</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold p-[1px] shadow-lg shadow-blue-500/10">
                        <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center overflow-hidden">
                            <UserCircle2 className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
