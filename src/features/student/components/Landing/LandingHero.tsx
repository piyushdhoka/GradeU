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
            {/* Background elements - Cleaned up glows */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#18181b_0%,transparent_70%)]" />
            </div>

            {/* Left Illustration */}
            <motion.div
                initial={{ opacity: 0, x: -80, rotate: -10 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute left-[1%] lg:left-[4%] top-[20%] lg:top-[25%] hidden md:block pointer-events-none z-0"
            >
                <motion.div
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Image
                        src="/science-l.svg"
                        alt="Science Illustration"
                        width={280}
                        height={280}
                        className="opacity-50 lg:opacity-70 drop-shadow-2xl w-[180px] lg:w-[300px]"
                    />
                </motion.div>
            </motion.div>

            {/* Right Illustration */}
            <motion.div
                initial={{ opacity: 0, x: 80, rotate: 10 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="absolute right-[1%] lg:right-[4%] bottom-[15%] lg:bottom-[20%] hidden md:block pointer-events-none z-0"
            >
                <motion.div
                    animate={{ y: [0, 15, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                    <Image
                        src="/cap-l.svg"
                        alt="Education Illustration"
                        width={240}
                        height={240}
                        className="opacity-50 lg:opacity-60 drop-shadow-2xl brightness-110 w-[150px] lg:w-[260px]"
                    />
                </motion.div>
            </motion.div>

            {/* Content */}
            <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs font-medium mb-6"
                >
                    <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                    <span>Better than Coursera</span>
                </motion.div>

                <div className="space-y-4 lg:space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-[0.95]"
                    >
                        Master Any Subject <br />
                        <span className="flex flex-wrap justify-center items-center gap-x-3">
                            With
                            <FlipWords
                                words={features}
                                className="italic bg-transparent p-0 text-white"
                            />
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto leading-tight font-medium"
                    >
                        The complete platform to learn, practice, and achieve your academic goals. <br className="hidden md:block" />
                        No fluff, just results.
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
