import { useState, useEffect } from 'react';
import { adminService } from '@services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { BarChart, Activity } from 'lucide-react';

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
            <h2 className="text-2xl font-bold font-display text-white border-l-4 border-primary pl-4">System Analytics & AI Monitoring</h2>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass border-0 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-4xl font-bold text-white font-mono">{stats?.users?.total || 0}</div>
                        <div className="flex gap-4 mt-2">
                            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                {stats?.users?.students || 0} Students
                            </span>
                            <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                                {stats?.users?.teachers || 0} Teachers
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass border-0 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-colors" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Courses</CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-4xl font-bold text-white font-mono">{stats?.courses?.total || 0}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            <span className="text-white font-medium">{stats?.courses?.published || 0}</span> Published
                        </p>
                    </CardContent>
                </Card>

                <Card className="glass border-0 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-colors" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Enrollments</CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-4xl font-bold text-white font-mono">{stats?.enrollments?.total || 0}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            <span className="text-emerald-400">+{stats?.enrollments?.thisMonth || 0}</span> this month
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* AI Generation Jobs */}
            <Card className="glass border-0 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                    <CardTitle className="flex items-center gap-3 text-xl text-white font-display">
                        <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20">
                            <Activity className="h-5 w-5 text-pink-400" />
                        </div>
                        AI Course Generation Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full resize-none">
                            <thead>
                                <tr className="border-b border-white/5 bg-black/20">
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Job ID</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Type</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Status</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {aiJobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground italic">No recent AI jobs found</td>
                                    </tr>
                                ) : (
                                    aiJobs.map((job) => (
                                        <tr key={job.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">{job.id.slice(0, 8)}</span>
                                            </td>
                                            <td className="p-4 text-white font-medium">{job.type || 'Course Gen'}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        job.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${job.status === 'completed' ? 'bg-emerald-400' :
                                                            job.status === 'failed' ? 'bg-red-400' :
                                                                'bg-amber-400 animate-pulse'
                                                        }`}></span>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground font-mono">
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
