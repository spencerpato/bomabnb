-- Fix: Allow users to insert 'partner' role during registration
-- Drop the restrictive policy
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

-- Create a new policy that allows:
-- 1. Admins to insert any role
-- 2. Users to insert 'partner' role for themselves during registration
CREATE POLICY "Users can insert partner role, admins can insert any role"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    -- Allow admins to insert any role
    public.has_role(auth.uid(), 'admin')
    OR
    -- Allow users to insert 'partner' role for themselves
    (auth.uid() = user_id AND role = 'partner')
  );
