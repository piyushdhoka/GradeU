import { StudentDashboardSummary, StudentCourseSummary, StudentProfile } from '../models/studentModel.js';
import { StudentExperience } from '../models/StudentExperience.js';
import { supabase } from '../../../shared/lib/supabase.js';
import { StudentProgress } from '../../../shared/models/StudentProgress.js';
import { Course } from '../../../shared/models/Course.js';
import { logger } from '../../../shared/lib/logger.js';

const sampleProfile = new StudentProfile({
  id: 'student-001',
  name: 'Demo Student',
  enrolledCourses: ['netsec-basics', 'ethical-hacking-101'],
  upcomingAssessments: ['assessment-001'],
  lastLogin: new Date().toISOString()
});

const sampleCourses: StudentCourseSummary[] = [
  new StudentCourseSummary({ id: 'netsec-basics', title: 'Network Security Basics', progress: 0.65 }),
  new StudentCourseSummary({ id: 'ethical-hacking-101', title: 'Ethical Hacking 101', progress: 0.42 })
];

export async function getStudentDashboardSummary(studentId: string, studentEmail: string): Promise<StudentDashboardSummary> {
  try {
    // 1. Calculate total study time from MongoDB
    const experiences = await StudentExperience.find({ studentId });
    const totalSeconds = experiences.reduce((acc, exp) => acc + (exp.totalTimeSpent || 0), 0);

    // 2. Format study time
    const studyTime = totalSeconds < 3600
      ? `${Math.floor(totalSeconds / 60)} mins`
      : `${(totalSeconds / 3600).toFixed(1)} hours`;

    // 3. Fetch Recent Progress & Activity from MongoDB
    const mongoProgress = await StudentProgress.find({ studentEmail }).sort({ updatedAt: -1 });

    // 4. Fetch Progress from Supabase (including course_id via join)
    const { data: supabaseProgress, error: supabaseError } = await supabase
      .from('module_progress')
      .select(`
        *,
        module:modules(course_id)
      `)
      .eq('student_id', studentId)
      .order('completed_at', { ascending: false });

    if (supabaseError) {
      logger.error('Error fetching Supabase progress for dashboard', supabaseError);
    }

    // 5. Fetch Enrollments from Supabase (to know which courses the student is in)
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', studentId);

    // 6. Combine Progress
    const allProgressEvents: any[] = [
      ...mongoProgress.map(p => ({
        id: p._id.toString(),
        courseId: p.courseId,
        moduleId: p.moduleId,
        completed: p.completed,
        updatedAt: p.updatedAt,
        source: 'mongodb'
      })),
      ...(supabaseProgress || []).map(p => ({
        id: p.id,
        courseId: (p.module as any)?.course_id || 'manual-course',
        moduleId: p.module_id,
        completed: p.completed,
        updatedAt: new Date(p.completed_at || p.created_at || Date.now()),
        source: 'supabase'
      }))
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // 7. Get unique course IDs
    const mongoCourseIds = [...new Set(mongoProgress.map(p => p.courseId))];
    const supabaseCourseIds = [...new Set((enrollments || []).map(e => e.course_id))];
    const allCourseIds = [...new Set([...mongoCourseIds, ...supabaseCourseIds])];

    const courses = await Course.find({
      $or: [
        { _id: { $in: allCourseIds.filter(id => id.length === 24) } },
        { code: { $in: allCourseIds } }
      ]
    }).select('title description modules code');

    const courseMap = new Map();
    courses.forEach(c => {
      courseMap.set(c._id.toString(), c);
      if (c.code) courseMap.set(c.code, c);
    });

    const findCourse = (id: string) => courseMap.get(id);

    // 8. Map Unified Activities
    const activities = allProgressEvents.slice(0, 5).map(p => {
      const course = findCourse(p.courseId);
      const moduleTitle = course?.modules?.find((m: any) => (m._id || m.id).toString() === p.moduleId)?.title || 'Module';

      return {
        id: p.id,
        action: p.completed
          ? `Completed ${moduleTitle} in ${course?.title || 'Course'}`
          : `Started ${moduleTitle} in ${course?.title || 'Course'}`,
        timestamp: p.updatedAt,
        type: (p.completed ? 'completion' : 'start') as any,
        courseId: p.courseId,
        moduleId: p.moduleId
      };
    });

    // 9. Find Active Course (most recently touched)
    const lastActiveEvent = allProgressEvents.find(p => !p.completed) || allProgressEvents[0];
    let activeCourse = undefined;

    if (lastActiveEvent) {
      const course = findCourse(lastActiveEvent.courseId);
      if (course) {
        // Calculate completion for this specific course
        const courseProgressDocs = allProgressEvents.filter(p => p.courseId === lastActiveEvent.courseId && p.completed);
        const totalModules = course.modules?.length || 1;
        const currentModule = course.modules?.find((m: any) => (m._id || m.id).toString() === lastActiveEvent.moduleId);

        activeCourse = {
          courseId: lastActiveEvent.courseId,
          title: course.title,
          description: course.description || '',
          progress: Math.round((courseProgressDocs.length / totalModules) * 100),
          currentModuleId: lastActiveEvent.moduleId,
          currentModuleTitle: currentModule?.title || 'Current Module'
        };
      }
    }

    return new StudentDashboardSummary({
      profile: new StudentProfile({
        ...sampleProfile,
        id: studentId
      }),
      stats: {
        completedCourses: 0, // Simplified
        activeCourses: allCourseIds.length,
        courseSummaries: [],
        totalStudyTime: studyTime,
        activeCourse,
        activities
      }
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error fetching dashboard summary:', err);
    return new StudentDashboardSummary({
      profile: sampleProfile,
      stats: {
        completedCourses: 0,
        activeCourses: 0,
        courseSummaries: [],
        totalStudyTime: '0 mins',
        activities: []
      }
    });
  }
}
