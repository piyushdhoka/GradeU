import { useState, useEffect } from 'react';
import { adminService } from '@services/adminService';
import { Card, CardContent } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button'; // Assuming we have this, or use standard button

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
            <h2 className="text-2xl font-bold font-display text-white">Students Management</h2>
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
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold shadow-glow">
                                                        {student.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-white font-medium group-hover:text-primary transition-colors">{student.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground font-mono">
                                                {new Date(student.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <Badge className={student.is_active
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                }>
                                                    {student.is_active ? 'Active' : 'Banned'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => toggleStatus(student.id, student.is_active)}
                                                    className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-all duration-200 ${student.is_active
                                                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50'
                                                            : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50'
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
