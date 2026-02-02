import React from 'react';


export const LandingFooter: React.FC = () => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full max-w-7xl mx-auto px-6 py-8 border-t border-zinc-900 bg-black z-20 relative">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="GradeU" className="h-10 w-10" />
                <span className="text-2xl font-black tracking-tighter text-white font-display uppercase italic">
                    Grade<span className="text-brand-400">U</span>
                </span>
            </div>

            <div className="text-zinc-500 text-sm">
                &copy; {new Date().getFullYear()} GradeU by SparkStudio. All rights reserved.
            </div>
        </div>
    );
};
