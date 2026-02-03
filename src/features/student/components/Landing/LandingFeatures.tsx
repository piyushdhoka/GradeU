import React from 'react';
import { Tabs } from '@components/ui/tabs';

const TabImage = ({ src }: { src: string }) => (
  <img
    src={src}
    alt="Platform Feature"
    width="1000"
    height="1000"
    className="absolute inset-x-0 -bottom-10 mx-auto h-[60%] w-[90%] rounded-xl border border-zinc-800 object-cover object-left-top shadow-2xl md:h-[90%]"
  />
);

export const LandingFeatures: React.FC = () => {
  return (
    <section id="features" className="bg-[#050505] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">
            Everything you need to succeed
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            We provide the tools, you bring the dedication.
          </p>
        </div>

        <div className="b relative mx-auto flex h-[20rem] w-full max-w-5xl flex-col items-start justify-start [perspective:1000px] md:h-[40rem]">
          <Tabs
            tabs={[
              {
                title: 'Student Dashboard',
                value: 'dashboard',
                content: (
                  <div className="relative h-full w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-xl font-bold text-white md:text-4xl">
                    <p>Track your progress</p>
                    <TabImage src="/tabs/dashboard.png" />
                  </div>
                ),
              },
              {
                title: 'Virtual Labs',
                value: 'labs',
                content: (
                  <div className="relative h-full w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-xl font-bold text-white md:text-4xl">
                    <p>Practice with real tools</p>
                    <TabImage src="/tabs/labs.png" />
                  </div>
                ),
              },
              {
                title: 'Training Courses',
                value: 'courses',
                content: (
                  <div className="relative h-full w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-xl font-bold text-white md:text-4xl">
                    <p>Learn from experts</p>
                    <TabImage src="/tabs/course.png" />
                  </div>
                ),
              },
              {
                title: 'Video Library',
                value: 'videos',
                content: (
                  <div className="relative h-full w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-xl font-bold text-white md:text-4xl">
                    <p>Watch and learn</p>
                    <TabImage src="/tabs/videos.png" />
                  </div>
                ),
              },
              {
                title: 'Your Profile',
                value: 'profile',
                content: (
                  <div className="relative h-full w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-10 text-xl font-bold text-white md:text-4xl">
                    <p>Track achievements</p>
                    <TabImage src="/tabs/profile.png" />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    </section>
  );
};
