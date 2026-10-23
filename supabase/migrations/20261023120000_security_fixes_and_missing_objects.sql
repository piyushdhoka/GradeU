-- Shared GradeU database (student site, admin portal, teacher app).
-- Applied 2026-10-23 after restoring the project. Backup taken first with pg_dump.
-- Supersedes admin branch's 20261023000000_admin_access.sql (included below).

-- 1. auth: GoTrue can't scan NULL token columns ("Database error finding users"
--    from auth.admin.listUsers). Affects accounts created by hand via SQL.
update auth.users set
  confirmation_token         = coalesce(confirmation_token, ''),
  recovery_token             = coalesce(recovery_token, ''),
  email_change_token_new     = coalesce(email_change_token_new, ''),
  email_change               = coalesce(email_change, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change               = coalesce(phone_change, ''),
  phone_change_token         = coalesce(phone_change_token, ''),
  reauthentication_token     = coalesce(reauthentication_token, '')
where confirmation_token is null or recovery_token is null
   or email_change_token_new is null or email_change is null
   or email_change_token_current is null or phone_change is null
   or phone_change_token is null or reauthentication_token is null;

-- 2. is_admin(): pin search_path and honour is_active. Same signature, so every
--    existing policy that calls it keeps working.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and coalesce(is_active, true)
  );
$$;

-- 3. Admins get full access to the tables the admin portal manages, so the
--    admin app no longer needs the service-role key in the browser.
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'teacher_details', 'courses', 'enrollments', 'modules', 'quizzes',
    'module_progress', 'generation_jobs', 'admin_audit_logs'
  ] loop
    execute format('drop policy if exists "Admins have full access" on public.%I', t);
    execute format(
      'create policy "Admins have full access" on public.%I for all to authenticated '
      'using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end $$;

-- 4. profiles: "Users can update own profile" let any student set role = 'admin'.
--    Only admins (or trusted server/DB connections) may change role or is_active,
--    and API callers may only create their own profile as a student.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Direct DB connections, GoTrue's signup trigger and the service role are trusted
  if coalesce(auth.role(), '') not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.role is distinct from 'student' then
    raise exception 'Only admins can create % profiles', new.role using errcode = '42501';
  end if;

  if tg_op = 'UPDATE'
     and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
    raise exception 'Only admins can change role or active status' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_privileges on public.profiles;
create trigger guard_profile_privileges
  before insert or update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- 5. quizzes had RLS disabled: anyone with the public anon key could edit or
--    delete every question. Reads stay public via the existing policy; writes
--    are now admin-only (the teacher app writes with the service role).
alter table public.quizzes enable row level security;

-- 6. modules: "Public read access for modules" (using true) exposed modules of
--    unpublished courses. Published, owner and admin read policies remain.
drop policy if exists "Public read access for modules" on public.modules;

-- 7. Course-generation embeddings (teacher worker). 768 dims = gemini-embedding-001
--    with outputDimensionality 768. Service role only, so RLS on with no policies.
create extension if not exists vector with schema extensions;

create table if not exists public.module_embeddings (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  content text not null,
  embedding extensions.vector(768) not null,
  created_at timestamptz not null default now()
);
alter table public.module_embeddings enable row level security;
create index if not exists module_embeddings_module_id_idx on public.module_embeddings (module_id);
create index if not exists module_embeddings_embedding_idx
  on public.module_embeddings using hnsw (embedding extensions.vector_cosine_ops);

-- 8. Student dashboard progress (studentService.getAllCoursesProgress).
--    Security invoker: module_progress RLS limits students to their own rows.
create or replace function public.get_module_completion(course_id uuid, user_id uuid)
returns table (progress integer)
language sql
stable
set search_path = ''
as $$
  select case
    when count(m.id) = 0 then 0
    else round(100.0 * count(distinct mp.module_id) filter (where mp.completed) / count(m.id))::integer
  end
  from public.modules m
  left join public.module_progress mp
    on mp.module_id = m.id and mp.student_id = get_module_completion.user_id
  where m.course_id = get_module_completion.course_id;
$$;

revoke all on function public.get_module_completion(uuid, uuid) from public, anon;
grant execute on function public.get_module_completion(uuid, uuid) to authenticated;

-- 9. Public certificate verification (/verify/[userId]). Returns only the
--    student's name and their issued certificates, nothing else from profiles.
create or replace function public.get_public_certificates(p_user_id uuid)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'name', p.full_name,
    'certificates', coalesce((
      select json_agg(json_build_object(
        'course_name', coalesce(c.course_name, co.title),
        'certificate_url', c.certificate_url,
        'issued_at', c.issued_at
      ) order by c.issued_at desc)
      from public.certificates c
      left join public.courses co on co.id = c.course_id
      where c.student_id = p.id
    ), '[]'::json)
  )
  from public.profiles p
  where p.id = p_user_id;
$$;

revoke all on function public.get_public_certificates(uuid) from public;
grant execute on function public.get_public_certificates(uuid) to anon, authenticated;
