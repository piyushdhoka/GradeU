import { useState, useEffect } from 'react';
import { adminService } from '@services/adminService';
import { Card, CardContent } from '@components/ui/card';
import { Badge } from '@components/ui/badge';

export const StudentsList = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            // We need to filter by role 'student' if getAllUsers returns everyone
            // adminService.getUsersByRole('student') is cleaner
            const data = await adminService.getUsersByRole('student');
            setStudents(data);
        } catch (error) {
            console.error('Failed to load students:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await adminService.toggleUserStatus(userId, !currentStatus);
            loadStudents(); // Refresh
        } catch (error) {
            alert('Failed to update status');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-light uppercase tracking-[0.2em] text-white">Students Management</h2>
            <Card className="glass border-0 overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground animate-pulse">Loading students...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full resize-none">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Name</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Joined</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Status</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student) => (
                                        <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-none bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white text-[10px] font-bold">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-white font-medium group-hover:text-zinc-300 transition-colors uppercase text-[10px] tracking-widest">{student.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground font-mono">
                                                {new Date(student.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <Badge className={student.is_active
                                                    ? 'bg-white text-black text-[9px] uppercase tracking-widest'
                                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 text-[9px] uppercase tracking-widest'
                                                }>
                                                    {student.is_active ? 'Active' : 'Banned'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => toggleStatus(student.id, student.is_active)}
                                                    className={`text-[10px] uppercase tracking-widest px-3 py-1 border transition-all duration-200 ${student.is_active
                                                        ? 'border-white/10 text-zinc-500 hover:text-white hover:border-white/30'
                                                        : 'border-white text-white hover:bg-white hover:text-black'
                                                        }`}
                                                >
                                                    {student.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
