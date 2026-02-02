import React from 'react';
import { Tabs } from '@components/ui/tabs';

const TabImage = ({ src }: { src: string }) => (
    <img
        src={src}
        alt="Platform Feature"
        width="1000"
        height="1000"
        className="object-cover object-left-top h-[60%] md:h-[90%] absolute -bottom-10 inset-x-0 w-[90%] rounded-xl mx-auto border border-zinc-800 shadow-2xl"
    />
);

export const LandingFeatures: React.FC = () => {
    return (
        <section id="features" className="py-24 px-6 bg-[#050505]">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Everything you need to succeed
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
                        We provide the tools, you bring the dedication.
                    </p>
                </div>

                <div className="h-[20rem] md:h-[40rem] [perspective:1000px] relative b flex flex-col max-w-5xl mx-auto w-full items-start justify-start">
                    <Tabs tabs={[
                        {
                            title: "Student Dashboard",
                            value: "dashboard",
                            content: (
                                <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-zinc-900 border border-zinc-800">
                                    <p>Track your progress</p>
                                    <TabImage src="/tabs/dashboard.png" />
                                </div>
                            ),
                        },
                        {
                            title: "Virtual Labs",
                            value: "labs",
                            content: (
                                <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-zinc-900 border border-zinc-800">
                                    <p>Practice with real tools</p>
                                    <TabImage src="/tabs/labs.png" />
                                </div>
                            ),
                        },
                        {
                            title: "Training Courses",
                            value: "courses",
                            content: (
                                <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-zinc-900 border border-zinc-800">
                                    <p>Learn from experts</p>
                                    <TabImage src="/tabs/course.png" />
                                </div>
                            ),
                        },
                        {
                            title: "Video Library",
                            value: "videos",
                            content: (
                                <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-zinc-900 border border-zinc-800">
                                    <p>Watch and learn</p>
                                    <TabImage src="/tabs/videos.png" />
                                </div>
                            ),
                        },
                        {
                            title: "Your Profile",
                            value: "profile",
                            content: (
                                <div className="w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold text-white bg-zinc-900 border border-zinc-800">
                                    <p>Track achievements</p>
                                    <TabImage src="/tabs/profile.png" />
                                </div>
                            ),
                        },
                    ]} />
                </div>
            </div>
        </section>
    );
};
