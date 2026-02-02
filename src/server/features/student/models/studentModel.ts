export interface IStudentProfile {
  id: string;
  name: string;
  enrolledCourses: string[];
  upcomingAssessments: string[];
  lastLogin: string | null;
}

export class StudentProfile implements IStudentProfile {
  id: string;
  name: string;
  enrolledCourses: string[];
  upcomingAssessments: string[];
  lastLogin: string | null;

  constructor({ id, name, enrolledCourses = [], upcomingAssessments = [], lastLogin = null }: {
    id: string;
    name: string;
    enrolledCourses?: string[];
    upcomingAssessments?: string[];
    lastLogin?: string | null;
  }) {
    this.id = id;
    this.name = name;
    this.enrolledCourses = enrolledCourses;
    this.upcomingAssessments = upcomingAssessments;
    this.lastLogin = lastLogin;
  }

  // Helper to convert plain object to StudentProfile instance
  static fromObject(obj: any): StudentProfile {
    return new StudentProfile({
      id: obj.id || '',
      name: obj.name || '',
      enrolledCourses: obj.enrolledCourses || [],
      upcomingAssessments: obj.upcomingAssessments || [],
      lastLogin: obj.lastLogin || null
    });
  }
}

export interface IStudentCourseSummary {
  id: string;
  title: string;
  progress: number;
}

export class StudentCourseSummary implements IStudentCourseSummary {
  id: string;
  title: string;
  progress: number;

  constructor({ id, title, progress = 0 }: {
    id: string;
    title: string;
    progress?: number;
  }) {
    this.id = id;
    this.title = title;
    this.progress = progress;
  }
}

export interface IStudentDashboardStats {
  completedCourses: number;
  activeCourses: number;
  courseSummaries: StudentCourseSummary[];
  totalStudyTime: string;
  activeCourse?: {
    courseId: string;
    title: string;
    description: string;
    progress: number;
    currentModuleId: string;
    currentModuleTitle: string;
  };
  activities: {
    id: string;
    action: string;
    timestamp: Date;
    type: 'completion' | 'start' | 'achievement' | 'certificate';
    courseId?: string;
    moduleId?: string;
  }[];
}

export interface IStudentDashboardSummary {
  profile: StudentProfile;
  stats: IStudentDashboardStats;
}

export class StudentDashboardSummary implements IStudentDashboardSummary {
  profile: StudentProfile;
  stats: IStudentDashboardStats;

  constructor({ profile, stats }: {
    profile: StudentProfile;
    stats: IStudentDashboardStats;
  }) {
    this.profile = profile;
    this.stats = stats;
  }
}
