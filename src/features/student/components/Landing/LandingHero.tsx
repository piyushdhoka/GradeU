import React from 'react';
import { ArrowRight, Sparkles, BookOpen, Terminal, Brain } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import FoundersTooltip from './FoundersTooltip';
import { FlipWords } from '@shared/components/ui/flip-words';

export const LandingHero: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();

  const features = ['Hands-on Labs', 'AI Training', 'Real Cases', 'Expert Path'];

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard');
      return;
    }
    router.push('/login');
  };

  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden bg-black px-6 pt-16 pb-16 lg:h-[90vh]">
      {/* Background elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-full w-full bg-[#0a0a0b]" />
        <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[120px]" />
        <div className="bg-brand-400/[0.08] absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full blur-[100px]" />
      </div>

      {/* Left Illustration */}
      <motion.div
        initial={{ opacity: 0, x: -60, rotate: -5 }}
        animate={{ opacity: 1, x: 0, rotate: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="pointer-events-none absolute top-[25%] left-[2%] z-0 hidden md:block lg:top-[30%] lg:left-[5%]"
      >
        <div className="relative">
          <Image
            src="/science-l.svg"
            alt="Science"
            width={280}
            height={280}
            className="relative z-10 w-[180px] opacity-40 drop-shadow-2xl lg:w-[280px] lg:opacity-60"
          />
        </div>
      </motion.div>

      {/* Right Illustration */}
      <motion.div
        initial={{ opacity: 0, x: 60, rotate: 5 }}
        animate={{ opacity: 1, x: 0, rotate: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        className="pointer-events-none absolute right-[2%] bottom-[15%] z-0 hidden md:block lg:right-[5%] lg:bottom-[20%]"
      >
        <div className="relative">
          <Image
            src="/cap-l.svg"
            alt="Education"
            width={240}
            height={240}
            className="relative z-10 w-[150px] opacity-40 brightness-110 drop-shadow-2xl lg:w-[240px] lg:opacity-50"
          />
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-brand-400 border-brand-400/20 bg-brand-400/5 mb-8 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-bold tracking-widest uppercase backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Better than Coursera</span>
        </motion.div>

        <div className="w-full space-y-6 lg:space-y-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col items-center text-5xl leading-[0.9] font-black tracking-tighter text-white md:text-7xl lg:text-8xl"
          >
            <span className="block">Master Any Subject</span>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4">
              <span className="text-white">With</span>
              <div className="inline-block min-w-[280px] text-left">
                <FlipWords words={features} className="text-brand-400 p-0 italic" />
              </div>
            </div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mx-auto max-w-2xl text-lg leading-relaxed font-medium text-zinc-400 md:text-xl"
          >
            The complete platform to learn, practice, and achieve your technical goals.{' '}
            <br className="hidden md:block" />
            No fluff, just measurable results.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-4"
        >
          <button
            onClick={handleGetStarted}
            className="group bg-brand-400 hover:bg-brand-500 shadow-brand-400/20 hover:shadow-brand-400/30 relative flex items-center gap-3 rounded-full px-8 py-4 text-lg font-bold text-black shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <span>{user ? 'Access Dashboard' : 'Start Learning Free'}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('features');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-2 rounded-full border border-zinc-700 px-6 py-4 text-sm font-medium text-zinc-300 transition-all hover:border-zinc-500 hover:text-white"
          >
            See how it works
          </button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-6 border-t border-zinc-800/50 pt-8"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="bg-brand-400/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <BookOpen className="text-brand-400 h-5 w-5" />
            </div>
            <span className="text-2xl font-bold text-white">20+</span>
            <span className="text-xs font-medium text-zinc-500">Courses</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Terminal className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold text-white">50+</span>
            <span className="text-xs font-medium text-zinc-500">Practice Labs</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Brain className="h-5 w-5 text-violet-400" />
            </div>
            <span className="text-2xl font-bold text-white">AI</span>
            <span className="text-xs font-medium text-zinc-500">Powered Tutor</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-10 flex flex-col items-center justify-center gap-3"
        >
          <FoundersTooltip />
          <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase lg:text-xs">
            Bunkers who made this
          </span>
        </motion.div>
      </div>
    </section>
  );
};
