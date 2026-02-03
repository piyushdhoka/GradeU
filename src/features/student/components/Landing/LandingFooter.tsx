import React from 'react';

export const LandingFooter: React.FC = () => {
  return (
    <div className="relative z-20 mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 border-t border-zinc-900 bg-black px-6 py-8 md:flex-row">
      {/* Logo & Brand */}
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="GradeU" className="h-10 w-10" />
        <span className="font-display text-2xl font-black tracking-tighter text-white uppercase italic">
          Grade<span className="text-brand-400">U</span>
        </span>
      </div>

      <div className="text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} GradeU by SparkStudio. All rights reserved.
      </div>
    </div>
  );
};
