"use client";

import { useEffect, useState } from 'react';
import {
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    Clock,
    AlertCircle,
    BookOpen
} from 'lucide-react';
import { getStudents, StudentData } from '@/actions/get-students';

export default function StudentDatabase() {
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState<StudentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStudents() {
            try {
                const data = await getStudents();
                setStudents(data);
            } catch (err) {
                console.error("Failed to fetch students", err);
                setError("Failed to load student data.");
            } finally {
                setLoading(false);
            }
        }

        fetchStudents();
    }, []);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.course.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6 bg-white dark:bg-zinc-950 min-h-full transition-colors">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">Student Database</h1>
                    <p className="text-zinc-500 dark:text-zinc-500 mt-2 font-medium">Manage and track your students&apos; performance across all modules.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all">
                        <Filter className="w-4 h-4 text-blue-600 dark:text-blue-500" /> Filter
                    </button>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest">
                        Export Data
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 dark:text-zinc-500 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search for a student by name or course..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all outline-none text-zinc-900 dark:text-white font-medium placeholder-zinc-400 dark:placeholder-zinc-600 shadow-xl shadow-black/5 dark:shadow-black/20"
                />
            </div>

            {/* Main Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-lg shadow-black/5 dark:shadow-black/20">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">Loading student data...</div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500">{error}</div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-slate-400">Student</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-slate-400">Course</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-slate-400">Progress</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-slate-400">Test Score</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-slate-400">Status</th>
                                    <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-slate-400"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                                            No students found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-bold text-zinc-900 dark:text-white">{student.name}</p>
                                                    <p className="text-xs text-zinc-500 dark:text-slate-500 mt-0.5">{student.email}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-sm font-bold text-zinc-700 dark:text-slate-300">{student.course}</span>
                                                </div>
                                                <p className="text-xs text-zinc-500 dark:text-slate-500 mt-1">Modules: {student.modules}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-zinc-500 dark:text-slate-400">{student.progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-100 dark:border-zinc-700">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${student.progress >= 80
                                                                ? 'bg-blue-600 dark:bg-blue-500'
                                                                : student.progress >= 50
                                                                    ? 'bg-blue-500 dark:bg-blue-400'
                                                                    : 'bg-slate-500 dark:bg-slate-600'
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
                                                            <div className={`w-2 h-2 rounded-full ${student.testScore >= 90 ? 'bg-green-500 dark:bg-green-400' : student.testScore >= 70 ? 'bg-blue-500 dark:bg-blue-400' : 'bg-yellow-500 dark:bg-yellow-400'
                                                                }`} />
                                                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{student.testScore}%</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-zinc-500 dark:text-slate-600">No test taken</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${student.status === 'Completed'
                                                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                                                        : student.status === 'Behind'
                                                            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                                                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                                        }`}
                                                >
                                                    {student.status === 'Completed' && <CheckCircle2 className="w-3 h-3" />}
                                                    {student.status === 'Behind' && <AlertCircle className="w-3 h-3" />}
                                                    {student.status === 'Active' && <Clock className="w-3 h-3" />}
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100">
                                                    <MoreVertical className="w-4 h-4 text-zinc-400 dark:text-slate-500" />
                                                </button>
                                            </td>
                                        </tr>
                                    )))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
