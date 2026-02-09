import React from 'react';
import { Tabs } from '@components/ui/tabs';
import { BookOpen, Terminal, Video, BarChart3, Award } from 'lucide-react';

const TabImage = ({ src }: { src: string }) => (
  <img
    src={src}
    alt="Platform Feature"
    width="1000"
    height="1000"
    className="absolute inset-x-0 -bottom-10 mx-auto h-[60%] w-[90%] rounded-xl border border-zinc-800 object-cover object-left-top shadow-2xl md:h-[90%]"
  />
);

const featureHighlights = [
  {
    icon: BookOpen,
    title: 'Structured Courses',
    description: 'Expert-crafted modules with progressive difficulty',
    color: 'text-brand-400',
    bg: 'bg-brand-400/10',
  },
  {
    icon: Terminal,
    title: 'Hands-on Labs',
    description: 'Real-world practice environments',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Visual analytics on your learning journey',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
  {
    icon: Award,
    title: 'Certifications',
    description: 'Earn verified certificates upon completion',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
];

export const LandingFeatures: React.FC = () => {
  return (
    <section id="features" className="bg-[#050505] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <span className="mb-4 inline-block rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs font-bold tracking-widest text-zinc-400 uppercase">
            Platform Features
          </span>
          <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">
            Everything you need to succeed
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            We provide the tools, you bring the dedication.
          </p>
        </div>

        {/* Feature highlight cards */}
        <div className="mx-auto mb-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {featureHighlights.map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5 text-center transition-all hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${feature.bg}`}>
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
              </div>
              <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
              <p className="text-xs leading-relaxed text-zinc-500">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="relative mx-auto flex h-[20rem] w-full max-w-5xl flex-col items-start justify-start [perspective:1000px] md:h-[40rem]">
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
