"use client";

import Link from 'next/link';
import {
  BookOpen,
  Sparkles,
  FileText,
  ArrowUpRight,
  CheckCircle2,
  Award,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getRecentActivity, ActivityItem } from '@/actions/get-dashboard-activity';

export default function Dashboard() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      const data = await getRecentActivity();
      setActivities(data);
      setLoading(false);
    }
    fetchActivity();
  }, []);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Dashboard</h1>
        <p className="text-zinc-500 dark:text-slate-400 mt-2 font-medium">Welcome back! Here&apos;s your overview.</p>
      </div>
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generate Course Card */}
        <Link href="/generate" className="group">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 hover:border-blue-500 transition-all shadow-lg shadow-black/5 dark:shadow-black/20">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-zinc-400 dark:text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Generate New Course</h3>
            <p className="text-zinc-500 dark:text-slate-400 text-sm leading-relaxed">Create AI-powered courses with custom modules and topics</p>
          </div>
        </Link>

        {/* Upload Document Card */}
        <Link href="/generate/upload" className="group">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 hover:border-blue-500 transition-all shadow-lg shadow-black/5 dark:shadow-black/20">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-zinc-400 dark:text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Upload Document</h3>
            <p className="text-zinc-500 dark:text-slate-400 text-sm leading-relaxed">Generate courses from PDF or DOCX files automatically</p>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Recent Activity</h2>
          <Link href="/students" className="text-sm font-bold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
            View All →
          </Link>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-zinc-500 dark:text-zinc-400 py-4">Loading activity...</div>
          ) : activities.length === 0 ? (
            <div className="text-center text-zinc-500 dark:text-zinc-400 py-4">No recent activity found.</div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  {activity.type === 'enrollment' || activity.type === 'course_created' ? (
                    <BookOpen className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  ) : activity.type === 'quiz' ? (
                    <Award className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  ) : activity.type === 'login' ? (
                    <Users className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-900 dark:text-white font-bold">
                    {activity.studentName} {activity.description}
                  </p>
                  <p className="text-zinc-500 dark:text-slate-500 text-sm mt-0.5">{activity.timeAgo}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
