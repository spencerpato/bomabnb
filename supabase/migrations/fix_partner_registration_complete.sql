-- Complete fix for partner registration issues

-- 1. Fix user_roles policy - Allow users to insert 'partner' role during registration
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

CREATE POLICY "Users can insert partner role, admins can insert any role"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR
    (auth.uid() = user_id AND role = 'partner')
  );

-- 2. Fix partners policy - Ensure authenticated users can insert partner applications
-- Drop the existing policy
DROP POLICY IF EXISTS "Authenticated users can insert partner applications" ON public.partners;

-- Create a more permissive policy for partner registration
CREATE POLICY "Authenticated users can insert partner applications"
  ON public.partners FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
  );

-- 3. Ensure profiles can be created during signup
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = id
  );

-- 4. Add a policy to allow reading profiles during registration
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);
