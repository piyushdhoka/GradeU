import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, className = 'max-w-md' }) => {
  return (
    <div className="min-h-screen bg-[#000000] text-[#EAEAEA] font-sans selection:bg-[#00FF88]/30 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00FF8808_1px,transparent_1px),linear-gradient(to_bottom,#00FF8808_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none" />

      {/* Radial Gradient Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-125 bg-[#00FF88]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className={`w-full relative z-10 ${className}`}>
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group transition-all hover:scale-105">
            <img src="/cybercoach-logo.png" alt="Cybercoach" className="h-14 w-14 group-hover:scale-110 transition-transform" />
            <div className="text-left">
              <div className="text-xl font-black tracking-tighter text-white uppercase">Cyber <span className="text-[#00FF88]">Coach</span></div>
              <div className="text-[10px] font-mono text-[#00B37A] tracking-widest uppercase">Cybersecurity Ops</div>
            </div>
          </Link>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">{title}</h1>
          {subtitle && <p className="text-[#00B37A] font-mono text-sm tracking-wide uppercase">{subtitle}</p>}
        </div>

        {children}

        <div className="mt-8 text-center">
          <p className="text-xs text-[#00B37A]/50 font-mono">
            SECURE CONNECTION ESTABLISHED // V2.0.4
          </p>
        </div>
      </div>
    </div>
  );
};
