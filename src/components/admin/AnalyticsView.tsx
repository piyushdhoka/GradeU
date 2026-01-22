import { useState, useEffect } from 'react';
import { adminService } from '@services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';

export const AnalyticsView = () => {
    const [stats, setStats] = useState<any>(null);
    const [aiJobs, setAiJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsData, jobsData] = await Promise.all([
                adminService.getDashboardStats(),
                adminService.getGenerationJobs()
            ]);
            setStats(statsData);
            setAiJobs(jobsData);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-10 text-muted-foreground">Loading analytics...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <h2 className="text-xl font-light uppercase tracking-[0.2em] text-white">System Analytics</h2>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-black border border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white font-mono">{stats?.users?.total || 0}</div>
                        <div className="flex gap-4 mt-2">
                            <span className="text-[9px] text-zinc-400 bg-zinc-900 px-2 py-0.5 border border-zinc-800 uppercase tracking-widest">
                                {stats?.users?.students || 0} Students
                            </span>
                            <span className="text-[9px] text-zinc-400 bg-zinc-900 px-2 py-0.5 border border-zinc-800 uppercase tracking-widest">
                                {stats?.users?.teachers || 0} Teachers
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-black border border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Courses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white font-mono">{stats?.courses?.total || 0}</div>
                        <p className="text-[9px] text-zinc-400 mt-2 uppercase tracking-widest">
                            <span className="text-white font-medium">{stats?.courses?.published || 0}</span> Published
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-black border border-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Enrollments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white font-mono">{stats?.enrollments?.total || 0}</div>
                        <p className="text-[9px] text-zinc-400 mt-2 uppercase tracking-widest">
                            <span className="text-white">+{stats?.enrollments?.thisMonth || 0}</span> this month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* AI Generation Jobs */}
            <Card className="bg-black border border-white/10 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5 py-4 px-6">
                    <CardTitle className="flex items-center gap-3 text-xs text-white uppercase tracking-widest font-light">
                        Generation Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 bg-black">
                                    <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 text-left font-semibold">Job ID</th>
                                    <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 text-left font-semibold">Type</th>
                                    <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 text-left font-semibold">Status</th>
                                    <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 text-left font-semibold">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {aiJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-zinc-500 italic text-xs uppercase tracking-widest">No recent jobs</td>
                                    </tr>
                                ) : (
                                    aiJobs.map((job) => (
                                        <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <span className="font-mono text-[10px] text-white px-2 py-1 border border-white/10">{job.id.slice(0, 8)}</span>
                                            </td>
                                            <td className="p-4 text-[10px] text-white uppercase tracking-widest font-medium">{job.type || 'Course Gen'}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 text-[9px] uppercase tracking-widest border ${job.status === 'completed' ? 'bg-white text-black border-white' :
                                                    'bg-zinc-950 text-white border-zinc-800'
                                                    }`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[10px] text-zinc-500 font-mono uppercase">
                                                {new Date(job.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
