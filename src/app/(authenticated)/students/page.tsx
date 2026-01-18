"use client";

import { useState } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    ExternalLink,
    CheckCircle2,
    Clock,
    AlertCircle,
    BookOpen
} from 'lucide-react';

const studentsData = [
    { id: 1, name: 'Aryan Sharma', email: 'aryan@example.com', course: 'React Fundamentals', progress: 85, testScore: 92, status: 'Active', modules: '12/14' },
    { id: 2, name: 'Priya Patel', email: 'priya@example.com', course: 'Advanced UI Design', progress: 45, testScore: 78, status: 'Active', modules: '6/13' },
    { id: 3, name: 'Rahul Kumar', email: 'rahul@example.com', course: 'Next.js 16 Pro', progress: 100, testScore: 98, status: 'Completed', modules: '20/20' },
    { id: 4, name: 'Sneha Gupta', email: 'sneha@example.com', course: 'Data Science Basics', progress: 15, testScore: 0, status: 'Behind', modules: '2/15' },
    { id: 5, name: 'Amit Singh', email: 'amit@example.com', course: 'Machine Learning', progress: 62, testScore: 84, status: 'Active', modules: '8/12' },
    { id: 6, name: 'Kavita Reddy', email: 'kavita@example.com', course: 'Cloud Architecture', progress: 92, testScore: 89, status: 'Active', modules: '18/20' },
    { id: 7, name: 'Vikram Das', email: 'vikram@example.com', course: 'React Fundamentals', progress: 30, testScore: 72, status: 'Behind', modules: '4/14' },
];

export default function StudentDatabase() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = studentsData.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6 bg-zinc-950 min-h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">Student Database</h1>
                    <p className="text-zinc-500 mt-2 font-medium">Manage and track your students&apos; performance across all modules.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-zinc-800 bg-zinc-900 rounded-xl text-sm font-bold text-zinc-300 hover:bg-zinc-800 transition-all">
                        <Filter className="w-4 h-4 text-blue-500" /> Filter
                    </button>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest">
                        Export Data
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search for a student by name or course..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none text-white font-medium placeholder-zinc-600 shadow-xl"
                />
            </div>

            {/* Main Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-800/50">
                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Course</th>
                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</th>
                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Test Score</th>
                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-slate-400"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors group">
                                    <td className="p-4">
                                        <div>
                                            <p className="font-bold text-white">{student.name}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{student.email}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm font-bold text-slate-300">{student.course}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Modules: {student.modules}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-400">{student.progress}%</span>
                                            </div>
                                            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-700">
                                                <div
                                                    className={`h-full rounded-full transition-all ${student.progress >= 80
                                                        ? 'bg-blue-500'
                                                        : student.progress >= 50
                                                            ? 'bg-blue-400'
                                                            : 'bg-slate-600'
                                                        }`}
                                                    style={{ width: `${student.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {student.testScore > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${student.testScore >= 90 ? 'bg-green-400' : student.testScore >= 70 ? 'bg-blue-400' : 'bg-yellow-400'
                                                        }`} />
                                                    <span className="text-sm font-bold text-white">{student.testScore}%</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-slate-600">No test taken</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${student.status === 'Completed'
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : student.status === 'Behind'
                                                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}
                                        >
                                            {student.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                                            {student.status === 'Behind' && <AlertCircle className="w-3 h-3" />}
                                            {student.status === 'Active' && <Clock className="w-3 h-3" />}
                                            {student.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button className="p-2 rounded-lg hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100">
                                            <MoreVertical className="w-4 h-4 text-slate-500" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
