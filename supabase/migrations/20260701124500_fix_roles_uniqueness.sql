-- ============================================================
-- CLEANUP DUPLICATE ROLES & ENFORCE SINGLE ROLE PER USER
-- ============================================================

-- 1. Clean up duplicate user roles, keeping the latest one based on created_at
DELETE FROM public.user_roles
WHERE id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON (user_id) id
    FROM public.user_roles
    ORDER BY user_id, created_at DESC
  ) sub
);

-- 2. Drop the existing unique constraint on (user_id, role)
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- 3. Add a new unique constraint on user_id to ensure a user can only have one role
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- 4. Update public.handle_new_user() trigger function to handle automatic role assignment and conflict resolution
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.app_role;
BEGIN
  -- Insert profile into public.profiles
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();

  -- Determine role based on raw_user_meta_data
  IF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'admin' THEN
    assigned_role := 'admin'::public.app_role;
  ELSIF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'teacher' THEN
    assigned_role := 'teacher'::public.app_role;
  ELSE
    assigned_role := 'student'::public.app_role;
  END IF;

  -- Insert role into user_roles table, updating if exists (since user_id is now unique)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN NEW;
END;
$$;

-- 5. Create secure function to check if email already exists in auth.users
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(email_to_check)
  );
END;
$$;
