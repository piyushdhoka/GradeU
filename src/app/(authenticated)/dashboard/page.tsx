"use client";

import Link from 'next/link';
import {
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Target,
  Sparkles,
  FileText,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white tracking-tight">Dashboard</h1>
        <p className="text-slate-400 mt-2 font-medium">Welcome back! Here's your overview.</p>
      </div>
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generate Course Card */}
        <Link href="/generate" className="group">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-blue-500 transition-all shadow-lg shadow-black/20">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Generate New Course</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Create AI-powered courses with custom modules and topics</p>
          </div>
        </Link>

        {/* Upload Document Card */}
        <Link href="/generate/upload" className="group">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-blue-500 transition-all shadow-lg shadow-black/20">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Upload Document</h3>
            <p className="text-slate-400 text-sm leading-relaxed">Generate courses from PDF or DOCX files automatically</p>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white">Recent Activity</h2>
          <Link href="/students" className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
            View All →
          </Link>
        </div>
        <div className="space-y-4">
          {/* Activity Item 1 */}
          <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold">Sarah Chen completed &quot;Advanced React Patterns&quot;</p>
              <p className="text-slate-500 text-sm mt-0.5">2 hours ago</p>
            </div>
          </div>

          {/* Activity Item 2 */}
          <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Award className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold">John Doe achieved 95% on &quot;TypeScript Fundamentals&quot;</p>
              <p className="text-slate-500 text-sm mt-0.5">5 hours ago</p>
            </div>
          </div>

          {/* Activity Item 3 */}
          <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:border-zinc-600 transition-colors">
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold">New course &quot;Web Development Bootcamp&quot; was created</p>
              <p className="text-slate-500 text-sm mt-0.5">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
