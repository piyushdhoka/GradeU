import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  className = 'max-w-md',
}) => {
  return (
    <div className="text-brand-50 selection:bg-brand-400/30 relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4 font-sans">
      {/* Search for 'unique and bigger' text */}
      <div className={`relative z-10 w-full ${className}`}>
        <div className="mb-12 text-center">
          <Link
            href="/"
            className="group mb-8 inline-flex flex-col items-center gap-4 transition-all hover:opacity-90"
          >
            <img
              src="/logo.svg"
              alt="GradeU"
              className="h-24 w-24 transition-transform duration-500 group-hover:scale-105"
            />
            <div className="text-center">
              <div className="font-sans text-5xl leading-none font-black tracking-tighter text-white uppercase">
                Grade<span className="text-brand-400">U</span>
              </div>
              <div className="text-brand-400 mt-2 text-xs font-bold tracking-[0.3em] uppercase opacity-80">
                Empowering Excellence
              </div>
            </div>
          </Link>
          <h1 className="border-brand-400/20 font-display mb-2 inline-block border-b-2 pb-2 text-2xl font-black tracking-tight text-white uppercase">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-xs font-bold tracking-widest text-zinc-500 uppercase">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
};
