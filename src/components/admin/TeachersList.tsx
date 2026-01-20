import { useState, useEffect } from 'react';
import { adminService } from '@services/adminService';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Users } from 'lucide-react';
import { Badge } from '@components/ui/badge';

export const TeachersList = () => {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTeacher, setNewTeacher] = useState({
        name: '',
        email: '',
        password: '',
        bio: '',
        specialization: ''
    });

    // Teacher Details Modal State
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
    const [teacherAnalytics, setTeacherAnalytics] = useState<any>(null);
    const [teacherCourses, setTeacherCourses] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        loadTeachers();
    }, []);

    const loadTeachers = async () => {
        try {
            setError(null);
            const data = await adminService.getAllTeachers();
            setTeachers(data);
        } catch (err: any) {
            console.error('Failed to load teachers:', err);
            setError(err.message || 'Failed to load teachers');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setCreating(true);
            await adminService.createTeacher(newTeacher);
            setShowCreateModal(false);
            setNewTeacher({ name: '', email: '', password: '', bio: '', specialization: '' });
            loadTeachers();
        } catch (err: any) {
            alert('Failed to create teacher: ' + err.message);
        } finally {
            setCreating(false);
        }
    };

    const openTeacherDetails = async (teacher: any) => {
        setSelectedTeacher(teacher);
        setLoadingDetails(true);
        try {
            const [analytics, courses] = await Promise.all([
                adminService.getTeacherAnalytics(teacher.id),
                adminService.getTeacherCourses(teacher.id)
            ]);
            setTeacherAnalytics(analytics);
            setTeacherCourses(courses);
        } catch (error) {
            console.error('Failed to load teacher details:', error);
        } finally {
            setLoadingDetails(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-display text-white">Teachers Directory</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all shadow-glow flex items-center gap-2"
                >
                    <Users className="h-4 w-4" /> Add Teacher
                </button>
            </div>

            {/* Teacher Details Modal */}
            {selectedTeacher && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold font-display text-white">{selectedTeacher.name}</h2>
                                <p className="text-muted-foreground">{selectedTeacher.specialization}</p>
                            </div>
                            <button
                                onClick={() => setSelectedTeacher(null)}
                                className="text-muted-foreground hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                            >
                                ✕
                            </button>
                        </div>

                        {loadingDetails ? (
                            <div className="text-center py-10 text-muted-foreground animate-pulse">Loading details...</div>
                        ) : (
                            <div className="space-y-6 animate-scale-in">
                                {/* Analytics Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="admin-panel-card group">
                                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Courses</p>
                                        <p className="text-3xl font-bold text-white font-mono mt-2 group-hover:text-primary transition-colors">{teacherAnalytics?.courses || 0}</p>
                                    </div>
                                    <div className="admin-panel-card group">
                                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Total Enrollments</p>
                                        <p className="text-3xl font-bold text-white font-mono mt-2 group-hover:text-primary transition-colors">{teacherAnalytics?.totalEnrollments || 0}</p>
                                    </div>
                                    <div className="admin-panel-card group">
                                        <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Completed Modules</p>
                                        <p className="text-3xl font-bold text-white font-mono mt-2 group-hover:text-primary transition-colors">{teacherAnalytics?.completedModules || 0}</p>
                                    </div>
                                </div>

                                {/* Courses List */}
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3 font-display">Courses</h3>
                                    {teacherCourses.length === 0 ? (
                                        <p className="text-muted-foreground italic">No courses created yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {teacherCourses.map((course: any) => (
                                                <div key={course.id} className="bg-card/50 border border-border p-4 rounded-lg flex justify-between items-center hover:border-primary/50 transition-colors">
                                                    <div>
                                                        <p className="font-medium text-white">{course.title}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {course.is_published ? <span className="text-emerald-400">Published</span> : <span className="text-amber-400">Draft</span>} • {new Date(course.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground border-border">{course.enrollment_count} Students</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="glass-panel w-full max-w-md rounded-xl p-6">
                        <h2 className="text-xl font-bold mb-4 text-white font-display">Add New Teacher</h2>
                        <form onSubmit={handleCreateTeacher} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-secondary/50 border border-border rounded-lg p-2 focus:border-primary outline-none text-white transition-colors"
                                    value={newTeacher.name}
                                    onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-secondary/50 border border-border rounded-lg p-2 focus:border-primary outline-none text-white transition-colors"
                                    value={newTeacher.email}
                                    onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-secondary/50 border border-border rounded-lg p-2 focus:border-primary outline-none text-white transition-colors"
                                    value={newTeacher.password}
                                    onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Specialization</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-secondary/50 border border-border rounded-lg p-2 focus:border-primary outline-none text-white transition-colors"
                                    value={newTeacher.specialization}
                                    onChange={e => setNewTeacher({ ...newTeacher, specialization: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">Bio</label>
                                <textarea
                                    className="w-full bg-secondary/50 border border-border rounded-lg p-2 focus:border-primary outline-none min-h-[80px] text-white transition-colors"
                                    value={newTeacher.bio}
                                    onChange={e => setNewTeacher({ ...newTeacher, bio: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-all hover:shadow-glow disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Card className="glass border-0 overflow-hidden">
                <CardContent className="p-0">
                    {error ? (
                        <div className="text-center py-10 text-red-500 bg-red-500/10 rounded-lg border border-red-500/20 m-4">
                            <p className="font-bold">Error loading teachers</p>
                            <p className="text-sm mt-2">{error}</p>
                        </div>
                    ) : loading ? (
                        <div className="text-center py-10 text-muted-foreground">Loading teachers...</div>
                    ) : teachers.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">No teachers found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full resize-none">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5">
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Teacher</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Specialization</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Joined</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teachers.map((teacher) => (
                                        <tr
                                            key={teacher.id}
                                            className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                                            onClick={() => openTeacherDetails(teacher)}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-glow group-hover:scale-105 transition-transform">
                                                        {teacher.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white group-hover:text-primary transition-colors">{teacher.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{teacher.bio || 'No bio'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground border-border">
                                                    {teacher.specialization}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground font-mono">
                                                {new Date(teacher.joined_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/20">Active</Badge>
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
