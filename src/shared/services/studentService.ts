import { supabase } from '@lib/supabase';

export interface StudentStats {
  coursesCompleted: number;
  certificatesEarned: number;
  liveLabsCompleted: number;
  studyTime: string;
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

export interface FullDashboardData {
  stats: StudentStats;
  activities: RecentActivity[];
  activeOperation: ActiveOperation | null;
  labStats?: any;
}

// Cache for overview data to avoid repeated API calls
let overviewCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

class StudentService {
  private async getOverviewData(): Promise<any | null> {
    // Check cache first
    if (overviewCache && Date.now() - overviewCache.timestamp < CACHE_TTL) {
      return overviewCache.data;
    }

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      if (!token) return null;

      const response = await fetch('/api/student/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        overviewCache = { data, timestamp: Date.now() };
        return data;
      }
    } catch (e) {
      console.warn('Failed to fetch overview data:', e);
    }
    return null;
  }

  // Single method to get all dashboard data in one call
  async getFullDashboardData(userId: string): Promise<FullDashboardData> {
    const defaultData: FullDashboardData = {
      stats: {
        coursesCompleted: 0,
        certificatesEarned: 0,
        liveLabsCompleted: 0,
        studyTime: '0 mins',
      },
      activities: [],
      activeOperation: null,
    };

    try {
      const overviewData = await this.getOverviewData();

      if (overviewData?.stats) {
        const stats = overviewData.stats;

        const activities: RecentActivity[] = (stats.activities || []).map((a: any) => ({
          id: a.id,
          type: a.type === 'completion' ? 'completion' : 'start',
          action: a.action,
          created_at: a.timestamp,
          courseId: a.courseId,
          moduleId: a.moduleId,
        }));

        const activeOperation: ActiveOperation | null = stats.activeCourse
          ? {
              courseId: stats.activeCourse.courseId,
              title: stats.activeCourse.title,
              description: stats.activeCourse.description || '',
              currentModuleId: stats.activeCourse.currentModuleId,
              currentModuleTitle: stats.activeCourse.currentModuleTitle,
              progress: stats.activeCourse.progress,
              lastAccessed: new Date().toISOString(),
            }
          : null;

        return {
          stats: {
            coursesCompleted: stats.completedCourses || 0,
            certificatesEarned: stats.certificatesEarned || 0,
            liveLabsCompleted: stats.completedLabs || 0,
            studyTime: stats.totalStudyTime || '0 mins',
          },
          activities,
          activeOperation,
          labStats: overviewData.labStats,
        };
      }

      return defaultData;
    } catch (error) {
      console.error('Get full dashboard data error:', error);
      return defaultData;
    }
  }

  async getDashboardStats(userId: string): Promise<StudentStats> {
    try {
      // Try backend overview API first
      const overviewData = await this.getOverviewData();

      if (overviewData?.stats) {
        const stats = overviewData.stats;

        // Get certificates count from Supabase
        const { count: certificatesEarned } = await supabase
          .from('certificates')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId);

        return {
          coursesCompleted: stats.completedCourses || 0,
          certificatesEarned: certificatesEarned || 0,
          liveLabsCompleted: stats.completedLabs || 0,
          studyTime: stats.totalStudyTime || '0 mins',
        };
      }

      // Fallback to Supabase if API fails
      const { count: coursesCompleted } = await supabase
        .from('module_progress')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', userId)
        .eq('completed', true);

      const { count: certificatesEarned } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', userId);

      return {
        coursesCompleted: coursesCompleted || 0,
        certificatesEarned: certificatesEarned || 0,
        liveLabsCompleted: 0,
        studyTime: '0 mins',
      };
    } catch (error) {
      console.error('Get student dashboard stats error:', error);
      return {
        coursesCompleted: 0,
        certificatesEarned: 0,
        liveLabsCompleted: 0,
        studyTime: '0 mins',
      };
    }
  }

  async getRecentActivity(userId: string): Promise<RecentActivity[]> {
    try {
      // Try backend overview API first
      const overviewData = await this.getOverviewData();

      if (overviewData?.stats?.activities?.length > 0) {
        return overviewData.stats.activities.map((a: any) => ({
          id: a.id,
          action: a.action,
          created_at: a.timestamp,
          type: a.type === 'completion' ? 'completion' : 'start',
          courseId: a.courseId,
          moduleId: a.moduleId,
        }));
      }

      // Fallback to Supabase
      const { data: progressData, error: progressError } = await supabase
        .from('module_progress')
        .select('id, completed_at, completed, module_id')
        .eq('student_id', userId)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (progressError || !progressData) return [];

      return progressData.map((item: any) => ({
        id: item.id,
        action: item.completed ? 'Completed a module' : 'Started a module',
        created_at: item.completed_at || new Date().toISOString(),
        type: item.completed ? 'completion' : 'start',
        moduleId: item.module_id,
      }));
    } catch (error) {
      console.error('Get recent activity error:', error);
      return [];
    }
  }

  async getActiveOperation(userId: string): Promise<ActiveOperation | null> {
    try {
      // Try backend overview API first
      const overviewData = await this.getOverviewData();

      if (overviewData?.stats?.activeCourse) {
        const active = overviewData.stats.activeCourse;
        return {
          courseId: active.courseId,
          title: active.title,
          description: active.description || '',
          currentModuleId: active.currentModuleId,
          currentModuleTitle: active.currentModuleTitle,
          progress: active.progress,
          lastAccessed: new Date().toISOString(),
        };
      }

      // Fallback to Supabase
      const { data: results } = await supabase
        .from('module_progress')
        .select('completed_at, module_id')
        .eq('student_id', userId)
        .eq('completed', false)
        .order('completed_at', { ascending: false })
        .limit(1);

      const progressData = results?.[0];
      if (!progressData) return null;

      return {
        courseId: '',
        title: 'Continuing Course',
        description: 'Pick up where you left off',
        currentModuleId: progressData.module_id,
        currentModuleTitle: 'Next Module',
        progress: 0,
        lastAccessed: progressData?.completed_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Get active operation error:', error);
      return null;
    }
  }

  async getAllCoursesProgress(userId: string): Promise<CourseProgress[]> {
    try {
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title');

      if (coursesError || !courses) return [];

      const progressPromises = courses.map(async (course) => {
        const { data: completionData } = await supabase.rpc('get_module_completion', {
          course_id: course.id,
          user_id: userId,
        });

        const progress = completionData?.[0]?.progress || 0;

        return {
          courseId: course.id,
          title: course.title,
          progress: progress || 0,
          completed: progress >= 100,
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
