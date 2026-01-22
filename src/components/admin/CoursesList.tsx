import { useState, useEffect } from 'react';
import { adminService } from '@services/adminService';
import { Card, CardContent } from '@components/ui/card';
import { Badge } from '@components/ui/badge';

export const CoursesList = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await adminService.getAllCourses();
            setCourses(data);
        } catch (error) {
            console.error('Failed to load courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePublish = async (courseId: string, currentStatus: boolean) => {
        try {
            await adminService.updateCourseStatus(courseId, !currentStatus);
            loadCourses();
        } catch (error) {
            alert('Failed to update course status');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-light uppercase tracking-[0.2em] text-white">Course Oversight</h2>
            <Card className="bg-black border border-white/10">
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">Loading courses...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5 bg-black">
                                        <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 text-left font-semibold">Title</th>
                                        <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 text-left font-semibold">Teacher</th>
                                        <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 text-left font-semibold">Enrollments</th>
                                        <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 text-left font-semibold">Status</th>
                                        <th className="p-4 text-[10px] uppercase tracking-widest text-zinc-500 text-left font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map((course) => (
                                        <tr key={course.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-white font-medium">{course.title}</td>
                                            <td className="p-4 text-muted-foreground">{course.teacher?.name || 'Unknown'}</td>
                                            <td className="p-4 text-muted-foreground">{course.enrollment_count}</td>
                                            <td className="p-4">
                                                <Badge className={course.is_published ? 'bg-white text-black text-[9px] uppercase tracking-widest' : 'bg-zinc-800 text-zinc-500 border-zinc-700 text-[9px] uppercase tracking-widest'}>
                                                    {course.is_published ? 'Published' : 'Draft'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => togglePublish(course.id, course.is_published)}
                                                    className={`text-[10px] uppercase tracking-widest px-3 py-1 border transition-all duration-200 ${course.is_published ? 'border-white/10 text-zinc-500 hover:text-white hover:border-white/30' : 'border-white text-white hover:bg-white hover:text-black'}`}
                                                >
                                                    {course.is_published ? 'Unpublish' : 'Publish'}
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
