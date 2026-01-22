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
            <h2 className="text-xl font-light uppercase tracking-[0.2em] text-white">Audit Logs</h2>
            <Card className="bg-black border border-white/10 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5 py-4 px-6">
                    <CardTitle className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Recent System Activity</CardTitle>
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
                                    <div className="mt-1 relative px-2">
                                        <div className="w-1.5 h-1.5 bg-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-white text-xs font-light tracking-wide uppercase leading-none group-hover:text-zinc-300 transition-colors">{log.description}</p>
                                            <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap ml-4">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        {log.metadata && (
                                            <div className="mt-1.5 p-2 bg-zinc-950 border border-white/5 text-[9px] font-mono text-zinc-500 overflow-auto max-w-xl uppercase tracking-tighter">
                                                {JSON.stringify(log.metadata, null, 1)}
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
