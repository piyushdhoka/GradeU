'use client';

import React from 'react';
import Link from 'next/link';
import { Github, Twitter, Linkedin, ArrowUpRight } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <div className="relative z-20 border-t border-zinc-900 bg-black pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="md:col-span-2 lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <img src="/logo.png" alt="GradeU" className="h-10 w-10" />
              <span className="font-display text-2xl font-black tracking-tighter text-white uppercase italic">
                Grade<span className="text-brand-400">U</span>
              </span>
            </div>
            <p className="mb-8 max-w-sm text-sm leading-relaxed text-zinc-500">
              Empowering the next generation of technical experts through immersive labs, AI-driven
              diagnostic tools, and proctored academic excellence.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/GradeU_Edu"
                target="_blank"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-500 transition-all hover:border-zinc-700 hover:text-brand-400"
              >
                <Twitter size={16} />
              </a>
              <a
                href="https://github.com/gradeu-org"
                target="_blank"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-500 transition-all hover:border-zinc-700 hover:text-brand-400"
              >
                <Github size={16} />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-500 transition-all hover:border-zinc-700 hover:text-brand-400"
              >
                <Linkedin size={16} />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="mb-6 text-xs font-bold tracking-widest text-zinc-400 uppercase">
              Platform
            </h4>
            <ul className="space-y-3.5 text-sm text-zinc-500">
              <li>
                <Link href="/about" className="hover:text-brand-400 inline-flex items-center gap-1 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-400 inline-flex items-center gap-1 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-brand-400 inline-flex items-center gap-1 transition-colors">
                  Explore Courses
                </Link>
              </li>
              <li>
                <Link href="/labs" className="hover:text-brand-400 inline-flex items-center gap-1 transition-colors">
                  Hands-on Labs
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="mb-6 text-xs font-bold tracking-widest text-zinc-400 uppercase">Legal</h4>
            <ul className="space-y-3.5 text-sm text-zinc-500">
              <li>
                <Link href="/terms" className="hover:text-brand-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-brand-400 transition-colors">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-brand-400 transition-colors">
                  Community Forum
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/80 to-zinc-900/30 p-6">
              <h4 className="mb-2 text-xs font-bold tracking-widest text-white uppercase">
                Ready to start?
              </h4>
              <p className="mb-4 text-xs leading-relaxed text-zinc-500">
                Join 2000+ students mastering technical skills.
              </p>
              <Link href="/login">
                <button className="bg-brand-400 hover:bg-brand-500 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-black tracking-widest text-black uppercase transition-all">
                  Get Started
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-zinc-900 pt-8 md:flex-row">
          <div className="flex flex-col items-center gap-4 text-xs font-medium text-zinc-600 md:flex-row">
            <span>&copy; {new Date().getFullYear()} GradeU. All rights reserved.</span>
            <div className="hidden h-3 w-px bg-zinc-800 md:block" />
            <span className="flex items-center gap-1">
              Developed by{' '}
              <a
                href="https://movinglines.co.in"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-400 font-bold text-zinc-400 transition-colors"
              >
                MovingLines
              </a>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hover:border-brand-400/30 group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 transition-all">
              <div className="relative flex h-2 w-2">
                <div className="bg-brand-400 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></div>
                <div className="bg-brand-400 relative inline-flex h-2 w-2 rounded-full"></div>
              </div>
              <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase transition-colors group-hover:text-zinc-300">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
