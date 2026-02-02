import { supabase } from '@lib/supabase';

export interface StudentStats {
    coursesCompleted: number;
    certificatesEarned: number;
    liveLabsCompleted: number;
    studyTime: string; // This might need to be calculated or stored
}

export interface RecentActivity {
    id: string;
    action: string;
    created_at: string;
    type: 'completion' | 'start' | 'achievement' | 'certificate';
    courseId?: string;
    moduleId?: string;
}

export interface ActiveOperation {
    courseId: string;
    title: string;
    description: string;
    currentModuleId: string;
    currentModuleTitle: string;
    progress: number;
    lastAccessed: string;
}

export interface CourseProgress {
    courseId: string;
    title: string;
    progress: number;
    completed: boolean;
}

class StudentService {
    async getDashboardStats(userId: string): Promise<StudentStats> {
        try {
            // 1. Get completed courses count
            const { count: coursesCompleted, error: coursesError } = await supabase
                .from('module_progress')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', userId)
                .eq('completed', true);

            if (coursesError) throw new Error(`Failed to fetch completed courses: ${coursesError.message}`);

            // 2. Get certificates count
            const { count: certificatesEarned, error: certsError } = await supabase
                .from('certificates')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', userId);

            if (certsError && certsError.code !== 'PGRST116') {
                console.warn('Certificates table might not exist or error fetching:', certsError);
            }

            // 3. Get accurate study time from backend aggregation
            let studyTime = '0 mins';
            try {
                const session = (await supabase.auth.getSession()).data.session;
                const token = session?.access_token;

                const response = await fetch('/api/student/overview', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (response.ok) {
                    const data = await response.json();
                    studyTime = data.stats.totalStudyTime || '0 mins';

                    return {
                        coursesCompleted: data.stats.completedCourses || 0,
                        certificatesEarned: certificatesEarned || 0,
                        liveLabsCompleted: 0,
                        studyTime
                    };
                }
            } catch (e) {
                console.warn('Failed to fetch real study time, using estimate:', e);
            }

            // Fallback: Estimate study time based on completed modules if backend is down
            const { data: progressData } = await supabase
                .from('module_progress')
                .select('id')
                .eq('student_id', userId);

            const completedModules = progressData?.length || 0;
            const estimatedMinutes = completedModules * 10;
            const hours = Math.floor(estimatedMinutes / 60);
            studyTime = hours > 0 ? `${hours} hours` : `${estimatedMinutes} mins`;

            return {
                coursesCompleted: coursesCompleted || 0,
                certificatesEarned: certificatesEarned || 0,
                liveLabsCompleted: 0,
                studyTime
            };
        } catch (error) {
            console.error('Get student dashboard stats error:', error);
            throw error;
        }
    }

    async getRecentActivity(userId: string): Promise<RecentActivity[]> {
        try {
            // Try backend first for MongoDB activities
            try {
                const session = (await supabase.auth.getSession()).data.session;
                const token = session?.access_token;

                const response = await fetch('/api/student/overview', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.stats.activities?.length > 0) {
                        return data.stats.activities.map((a: any) => ({
                            id: a.id,
                            action: a.action,
                            created_at: a.timestamp,
                            type: a.type,
                            courseId: a.courseId,
                            moduleId: a.moduleId
                        }));
                    }
                }
            } catch (e) {
                console.warn('Backend activity fetch failed, falling back to Supabase:', e);
            }

            // Fallback to Supabase
            const { data: progressData, error: progressError } = await supabase
                .from('module_progress')
                .select(`
                  id,
                  completed_at,
                  completed,
                  module_id
                `)
                .eq('student_id', userId)
                .order('completed_at', { ascending: false })
                .limit(5);

            if (progressError) throw new Error(`Failed to fetch recent activity: ${progressError.message}`);

            return progressData.map((item: any) => ({
                id: item.id,
                action: item.completed
                    ? `Completed a module`
                    : `Started a module`,
                created_at: item.completed_at || new Date().toISOString(),
                type: item.completed ? 'completion' : 'start',
                courseId: undefined, // Supabase progress doesn't directly store course_id
                moduleId: item.module_id
            }));
        } catch (error) {
            console.error('Get recent activity error:', error);
            return [];
        }
    }

    async getActiveOperation(userId: string): Promise<ActiveOperation | null> {
        try {
            // Try backend first for MongoDB active course
            try {
                const session = (await supabase.auth.getSession()).data.session;
                const token = session?.access_token;

                const response = await fetch('/api/student/overview', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.stats.activeCourse) {
                        const active = data.stats.activeCourse;
                        return {
                            courseId: active.courseId,
                            title: active.title,
                            description: active.description,
                            currentModuleId: active.currentModuleId,
                            currentModuleTitle: active.currentModuleTitle,
                            progress: active.progress,
                            lastAccessed: new Date().toISOString()
                        };
                    }
                }
            } catch (e) {
                console.warn('Backend active course fetch failed, falling back to Supabase:', e);
            }

            // Fallback to Supabase (mostly for manually added UUID courses)
            const { data: results, error: progressError } = await supabase
                .from('module_progress')
                .select(`
                    completed_at,
                    module_id
                `)
                .eq('student_id', userId)
                .eq('completed', false)
                .order('completed_at', { ascending: false })
                .limit(1);

            const progressData = results?.[0];

            if (progressError || !progressData) return null;

            return {
                courseId: '',
                title: 'Continuing Course',
                description: 'Pick up where you left off',
                currentModuleId: progressData.module_id,
                currentModuleTitle: 'Next Module',
                progress: 0,
                lastAccessed: progressData?.completed_at || new Date().toISOString()
            };
        } catch (error) {
            console.error('Get active operation error:', error);
            return null;
        }
    }

    async getAllCoursesProgress(userId: string): Promise<CourseProgress[]> {
        try {
            // 1. Get all courses
            const { data: courses, error: coursesError } = await supabase
                .from('courses')
                .select('id, title');

            if (coursesError) throw new Error(`Failed to fetch courses: ${coursesError.message}`);
            if (!courses) return [];

            // 2. Calculate progress for each course
            const progressPromises = courses.map(async (course) => {
                const { data: completionData } = await supabase
                    .rpc('get_module_completion', {
                        course_id: course.id,
                        user_id: userId
                    });

                const progress = completionData && completionData.length > 0 ? completionData[0].progress : 0;

                return {
                    courseId: course.id,
                    title: course.title,
                    progress: progress || 0,
                    completed: progress >= 100
                };
            });

            return await Promise.all(progressPromises);
        } catch (error) {
            console.error('Get all courses progress error:', error);
            return [];
        }
    }

    async getCertificates(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('certificates')
                .select('*')
                .eq('student_id', userId)
                .order('issued_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get certificates error:', error);
            return [];
        }
    }
}

export const studentService = new StudentService();