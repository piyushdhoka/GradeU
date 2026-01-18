export interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'teacher' | 'student';
  level?: 'beginner' | 'intermediate' | 'advanced';
  certificates?: string[];
  completedAssessment?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Some API endpoints return a lightweight teacher object
export interface PartialTeacher {
  name?: string;
  email?: string;
  profile_image?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  // teacher may be null when imported or absent; some endpoints return a lightweight PartialTeacher
  teacher?: User | PartialTeacher | null;
  progress?: number;
  course_modules?: Module[];

  /* Additional metadata used in UI and services */
  is_published?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  enrollment_count?: number;
  rating?: number;
  estimated_hours?: number;
  created_at?: string;
  teacher_id?: string;
  category?: string;
  module_count?: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  course_id: string;
  completed?: boolean;
  testScore?: number;
  videoUrl?: string;
  labUrl?: string;
  order?: number;

  /* Compatibility fields used elsewhere */
  module_order?: number;
  questions?: Question[];
}

export interface Certificate {
  id: string;
  user_id: string;
  course_name: string;
  issued_date: string;
  certificate_url: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}