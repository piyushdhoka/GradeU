-- =========================
-- EXTENSIONS
-- =========================
create extension if not exists "pgcrypto";

-- =========================
-- BUCKETS (Categories)
-- =========================
create table public.buckets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- =========================
-- COURSES
-- =========================
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  bucket_id uuid references public.buckets(id) on delete cascade,
  title text not null,
  description text,
  created_by uuid references auth.users(id),
  is_published boolean default false,
  certificate_enabled boolean default false,
  created_at timestamptz default now()
);

-- =========================
-- MODULES (MARKDOWN)
-- =========================
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  content_markdown text not null,
  module_order int not null,
  created_at timestamptz default now()
);

-- =========================
-- USER PROFILES & ROLES
-- =========================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('admin','teacher','student')) not null default 'student',
  created_at timestamptz default now()
);

-- Auto-create profile (UPDATED FOR NAME & TEACHER ROLE)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    'teacher' -- FORCED ROLE
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================
-- ENROLLMENTS
-- =========================
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  enrolled_at timestamptz default now(),
  unique (student_id, course_id)
);

-- =========================
-- MODULE PROGRESS
-- =========================
create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  completed boolean default false,
  completed_at timestamptz,
  unique (student_id, module_id)
);

-- =========================
-- CERTIFICATES
-- =========================
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  issued_at timestamptz default now(),
  unique (student_id, course_id)
);

-- =========================
-- ENABLE RLS
-- =========================
alter table public.buckets enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.profiles enable row level security;
alter table public.enrollments enable row level security;
alter table public.module_progress enable row level security;
alter table public.certificates enable row level security;

-- =========================
-- RLS POLICIES
-- =========================

-- PROFILES
create policy "read own profile"
on public.profiles
for select
using (id = auth.uid());

create policy "admin read all profiles"
on public.profiles
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "update own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- COURSES
create policy "read published courses"
on public.courses
for select
using (is_published = true);

create policy "teacher admin create course"
on public.courses
for insert
with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('teacher','admin')
  )
);

-- MODULES
create policy "read enrolled modules"
on public.modules
for select
using (
  exists (
    select 1
    from public.enrollments e
    where e.student_id = auth.uid()
      and e.course_id = modules.course_id
  )
);

-- ENROLLMENTS
create policy "student enroll self"
on public.enrollments
for insert
with check (student_id = auth.uid());

create policy "read own enrollments"
on public.enrollments
for select
using (student_id = auth.uid());

-- MODULE PROGRESS
create policy "manage own progress"
on public.module_progress
for all
using (student_id = auth.uid())
with check (student_id = auth.uid());

-- CERTIFICATES
create policy "read own certificates"
on public.certificates
for select
using (student_id = auth.uid());
