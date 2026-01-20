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
            <h2 className="text-2xl font-bold text-white">Course Oversight</h2>
            <Card className="bg-white/5 border-white/10">
                <CardContent>
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">Loading courses...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 text-left">
                                        <th className="p-4 text-muted-foreground font-medium">Title</th>
                                        <th className="p-4 text-muted-foreground font-medium">Teacher</th>
                                        <th className="p-4 text-muted-foreground font-medium">Enrollments</th>
                                        <th className="p-4 text-muted-foreground font-medium">Status</th>
                                        <th className="p-4 text-muted-foreground font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.map((course) => (
                                        <tr key={course.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-white font-medium">{course.title}</td>
                                            <td className="p-4 text-muted-foreground">{course.teacher?.name || 'Unknown'}</td>
                                            <td className="p-4 text-muted-foreground">{course.enrollment_count}</td>
                                            <td className="p-4">
                                                <Badge variant={course.is_published ? 'success' : 'secondary'}>
                                                    {course.is_published ? 'Published' : 'Draft'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => togglePublish(course.id, course.is_published)}
                                                    className={`text-xs px-3 py-1 rounded border ${course.is_published ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-500/10' : 'border-emerald-500 text-emerald-500 hover:bg-emerald-500/10'}`}
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
