-- Update public.handle_new_user() trigger function to handle automatic role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.app_role;
BEGIN
  -- 1. Insert profile into public.profiles
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );

  -- 2. Determine role based on raw_user_meta_data
  IF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'admin' THEN
    assigned_role := 'admin'::public.app_role;
  ELSIF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'teacher' THEN
    assigned_role := 'teacher'::public.app_role;
  ELSE
    assigned_role := 'student'::public.app_role;
  END IF;

  -- 3. Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
