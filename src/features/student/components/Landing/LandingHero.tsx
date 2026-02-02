import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import FoundersTooltip from './FoundersTooltip';
import { FlipWords } from '@shared/components/ui/flip-words';

export const LandingHero: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();

    const features = ["Hands-on Labs", "AI Training", "Real Cases", "Expert Path"];

    const handleGetStarted = () => {
        if (user) {
            router.push('/dashboard');
            return;
        }
        router.push('/login');
    };

    return (
        <section className="relative min-h-[85vh] lg:h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-12 pb-12 px-6 bg-black">
            {/* Background elements - Refined Mesh */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[#0a0a0b]" />
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-400/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-400/5 blur-[120px] rounded-full" />
            </div>

            {/* Left Illustration */}
            <motion.div
                initial={{ opacity: 0, x: -60, rotate: -5 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute left-[2%] lg:left-[5%] top-[25%] lg:top-[30%] hidden md:block pointer-events-none z-0"
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-brand-400/20 blur-[60px] rounded-full" />
                    <Image
                        src="/science-l.svg"
                        alt="Science"
                        width={280}
                        height={280}
                        className="opacity-40 lg:opacity-60 drop-shadow-2xl w-[180px] lg:w-[280px] relative z-10"
                    />
                </div>
            </motion.div>

            {/* Right Illustration */}
            <motion.div
                initial={{ opacity: 0, x: 60, rotate: 5 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="absolute right-[2%] lg:right-[5%] bottom-[15%] lg:bottom-[20%] hidden md:block pointer-events-none z-0"
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-white/5 blur-[60px] rounded-full" />
                    <Image
                        src="/cap-l.svg"
                        alt="Education"
                        width={240}
                        height={240}
                        className="opacity-40 lg:opacity-50 drop-shadow-2xl brightness-110 w-[150px] lg:w-[240px] relative z-10"
                    />
                </div>
            </motion.div>

            {/* Content */}
            <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-400 text-xs font-bold uppercase tracking-widest mb-8"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Better than Coursera</span>
                </motion.div>

                <div className="space-y-6 lg:space-y-8 w-full">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[0.9] flex flex-col items-center"
                    >
                        <span className="block">Master Any Subject</span>
                        <div className="flex flex-wrap justify-center items-center gap-x-4 mt-2">
                            <span className="text-zinc-500">With</span>
                            <div className="inline-block min-w-[280px] text-left">
                                <FlipWords
                                    words={features}
                                    className="italic text-brand-400 p-0"
                                />
                            </div>
                        </div>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium"
                    >
                        The complete platform to learn, practice, and achieve your technical goals. <br className="hidden md:block" />
                        No fluff, just measurable results.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col items-center gap-4 mt-8"
                >
                    <button
                        onClick={handleGetStarted}
                        className="group relative flex items-center gap-3 px-8 py-4 bg-brand-400 hover:bg-brand-500 text-black rounded-full font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg"
                    >
                        <span>{user ? 'Access Dashboard' : 'Start Learning Free'}</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="flex flex-col items-center justify-center gap-3 mt-10"
                >
                    <FoundersTooltip />
                    <span className="text-zinc-500 text-[10px] lg:text-xs tracking-[0.2em] uppercase font-bold">
                        Bunkers who made this
                    </span>
                </motion.div>
            </div>
        </section>
    );
};
