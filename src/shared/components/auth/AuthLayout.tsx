import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, className = 'max-w-md' }) => {
  return (
    <div className="min-h-screen bg-black text-brand-50 font-sans selection:bg-brand-400/30 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Search for 'unique and bigger' text */}
      <div className={`w-full relative z-10 ${className}`}>
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex flex-col items-center gap-4 mb-8 group transition-all hover:opacity-90">
            <img src="/logo.svg" alt="GradeU" className="h-24 w-24 transition-transform duration-500 group-hover:scale-105" />
            <div className="text-center">
              <div className="text-5xl font-black tracking-tighter text-white uppercase font-sans leading-none">
                Grade<span className="text-brand-400">U</span>
              </div>
              <div className="text-xs font-bold text-brand-400 tracking-[0.3em] uppercase mt-2 opacity-80">Empowering Excellence</div>
            </div>
          </Link>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2 border-b-2 border-brand-400/20 pb-2 inline-block font-display">{title}</h1>
          {subtitle && <p className="text-zinc-500 font-bold text-xs tracking-widest uppercase mt-4">{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  );
};
