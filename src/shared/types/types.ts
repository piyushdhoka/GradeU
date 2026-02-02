export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'teacher';
  avatar_url?: string;
  created_at?: string;
  certificates?: string[];
  phone_number?: string;
  faculty?: string;
  department?: string;
  contact_email?: string;
  email_type?: 'vu' | 'personal';
  onboarding_completed?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  teacher_name?: string;
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
  topics?: { title: string; content: string }[];
  completedTopics?: string[];

  /* Compatibility fields used elsewhere */
  module_order?: number;
  questions?: Question[];
  quiz?: any[]; // MongoDB quiz format
  type?: 'lecture' | 'quiz' | 'initial_assessment' | 'final_assessment';
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