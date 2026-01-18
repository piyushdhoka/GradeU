-- 1. Update the handle_new_user trigger function
-- This will now look for 'full_name' in the user_metadata and default the role to 'teacher'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    'teacher' -- FORCE ROLE TO TEACHER
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add Policy to allow users to update their own profile (e.g. fix their name)
-- Dropping first to avoid conflicts if you ran something similar before manually
DROP POLICY IF EXISTS "update own profile" ON public.profiles;

CREATE POLICY "update own profile"
ON public.profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
