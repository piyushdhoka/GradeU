-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  target_user_id uuid,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT admin_audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id),
  CONSTRAINT admin_audit_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  course_id uuid,
  issued_at timestamp with time zone DEFAULT now(),
  course_name text,
  certificate_url text,
  CONSTRAINT certificates_pkey PRIMARY KEY (id),
  CONSTRAINT certificates_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id),
  CONSTRAINT certificates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid,
  is_published boolean DEFAULT false,
  certificate_enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  course_id uuid,
  enrolled_at timestamp with time zone DEFAULT now(),
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id),
  CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.generation_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_title text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'::text,
  progress integer DEFAULT 0,
  current_module text,
  metadata jsonb,
  results jsonb,
  error text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT generation_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT generation_jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.lab_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  lab_id text NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lab_completions_pkey PRIMARY KEY (id),
  CONSTRAINT lab_completions_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id)
);
CREATE TABLE public.module_experience (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  course_id uuid NOT NULL,
  module_id uuid NOT NULL,
  time_spent integer DEFAULT 0,
  scroll_depth integer DEFAULT 0,
  interactions integer DEFAULT 0,
  last_accessed timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT module_experience_pkey PRIMARY KEY (id),
  CONSTRAINT module_experience_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id),
  CONSTRAINT module_experience_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT module_experience_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id)
);
CREATE TABLE public.module_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid,
  module_id uuid,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  quiz_score integer,
  updated_at timestamp with time zone DEFAULT now(),
  completed_topics jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT module_progress_pkey PRIMARY KEY (id),
  CONSTRAINT module_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id),
  CONSTRAINT module_progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id)
);
CREATE TABLE public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid,
  title text NOT NULL,
  content_markdown text NOT NULL,
  module_order integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  topics jsonb,
  CONSTRAINT modules_pkey PRIMARY KEY (id),
  CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['admin'::text, 'teacher'::text, 'student'::text])),
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  phone_number text,
  faculty text,
  department text,
  contact_email text,
  email_type text DEFAULT 'personal'::text CHECK (email_type = ANY (ARRAY['vu'::text, 'personal'::text])),
  onboarding_completed boolean DEFAULT false,
  welcome_email_sent boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  module_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  proctoring_session_id text,
  violation_count integer DEFAULT 0,
  completed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id),
  CONSTRAINT quiz_attempts_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id)
);
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_option integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id)
);
CREATE TABLE public.teacher_details (
  id uuid NOT NULL,
  specialization text,
  bio text,
  signature_url text,
  updated_at timestamp with time zone DEFAULT now(),
  teacher_name text,
  CONSTRAINT teacher_details_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_details_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id)
);