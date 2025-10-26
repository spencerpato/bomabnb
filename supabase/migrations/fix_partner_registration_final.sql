-- Final fix for partner registration - Safe to run multiple times

-- 1. Fix user_roles policy (skip if already exists)
DO $$ 
BEGIN
  -- Drop and recreate to ensure correct policy
  DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Users can insert partner role, admins can insert any role" ON public.user_roles;

  CREATE POLICY "Users can insert partner role, admins can insert any role"
    ON public.user_roles FOR INSERT
    WITH CHECK (
      public.has_role(auth.uid(), 'admin')
      OR
      (auth.uid() = user_id AND role = 'partner')
    );
END $$;

-- 2. Fix partners policy
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can insert partner applications" ON public.partners;

  CREATE POLICY "Authenticated users can insert partner applications"
    ON public.partners FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL 
      AND auth.uid() = user_id
    );
END $$;

-- 3. Ensure profiles can be created
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

  CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (
      auth.uid() IS NOT NULL
      AND auth.uid() = id
    );
END $$;

-- 4. Allow reading profiles
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

  CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);
END $$;
