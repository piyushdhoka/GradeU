import { useState, useEffect } from 'react';
import { adminService } from '@services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';

export const AuditLogs = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            const data = await adminService.getSystemActivity();
            setLogs(data);
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold font-display text-white border-l-4 border-cyan-500 pl-4">Audit Logs</h2>
            <Card className="glass border-0 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent System Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground animate-pulse">Loading logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground italic">No recent activity recorded.</div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {logs.map((log, index) => (
                                <div key={index} className="flex gap-4 items-start p-4 hover:bg-white/5 transition-colors group">
                                    <div className="mt-1 relative">
                                        <div className={`w-2.5 h-2.5 rounded-full ${log.type === 'user_joined' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                                                log.type === 'course_created' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' :
                                                    log.type === 'login' ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]' :
                                                        'bg-gray-400'
                                            }`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-white text-sm font-medium leading-none group-hover:text-primary transition-colors">{log.description}</p>
                                            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap ml-4">
                                                {new Date(log.timestamp).toLocaleString(undefined, {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        {log.metadata && (
                                            <div className="mt-1.5 p-2 rounded bg-black/40 border border-white/5 text-xs font-mono text-muted-foreground overflow-auto max-w-xl">
                                                {JSON.stringify(log.metadata, null, 2)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
