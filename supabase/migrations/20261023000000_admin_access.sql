-- Admin portal access through RLS, so the admin app never needs the service-role key
-- in the browser. Run after the base schema (profiles, courses, ...) exists.

-- True when the current API caller is an active admin.
-- security definer so it can read profiles without recursing into profiles' own policies.
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

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admins get full access to the tables the admin portal manages
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'teacher_details', 'courses', 'enrollments', 'modules',
    'module_progress', 'generation_jobs', 'assessment_responses', 'admin_audit_logs'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists "Admins have full access" on public.%I', t);
      execute format(
        'create policy "Admins have full access" on public.%I for all to authenticated '
        'using (public.is_admin()) with check (public.is_admin())',
        t
      );
    end if;
  end loop;
end $$;

-- Stop users from making themselves admin (or reactivating themselves) through the API.
-- Direct DB connections and the service role are trusted; only API callers are checked.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.role = 'admin' then
    raise exception 'Only admins can grant the admin role' using errcode = '42501';
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
