-- Drop the existing admin-only routines policy
DROP POLICY IF EXISTS "Admins can manage routines" ON public.routines;

-- Create a new policy allowing both admins and teachers to manage routines
-- WITH CHECK is required explicitly for INSERT/UPDATE operations
CREATE POLICY "Admins and teachers can manage routines" ON public.routines
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'teacher'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'teacher'::public.app_role)
  );
