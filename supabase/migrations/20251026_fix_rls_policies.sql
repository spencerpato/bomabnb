-- Fix Row Level Security Policies for Agent Registration and Admin Access
-- This migration allows users to register as agents/partners and admins to view all data

-- ============================================
-- 1. FIX USER_ROLES TABLE RLS
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own role during registration" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own role during registration (authenticated users only)
CREATE POLICY "Users can insert their own role during registration"
ON user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own roles
CREATE POLICY "Users can view their own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all roles
CREATE POLICY "Admins can view all roles"
ON user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Allow admins to manage all roles (insert, update, delete)
CREATE POLICY "Admins can manage all roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================
-- 2. FIX PROFILES TABLE RLS
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Allow public viewing of profiles (for displaying agent/partner info)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 3. FIX REFERRERS TABLE RLS
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can insert their own referrer record" ON referrers;
DROP POLICY IF EXISTS "Users can view their own referrer data" ON referrers;
DROP POLICY IF EXISTS "Users can update their own referrer data" ON referrers;
DROP POLICY IF EXISTS "Admins can view all referrers" ON referrers;
DROP POLICY IF EXISTS "Admins can manage all referrers" ON referrers;

-- Enable RLS on referrers
ALTER TABLE referrers ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own referrer record during registration
CREATE POLICY "Users can insert their own referrer record"
ON referrers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own referrer data
CREATE POLICY "Users can view their own referrer data"
ON referrers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own referrer data
CREATE POLICY "Users can update their own referrer data"
ON referrers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all referrers (agents)
CREATE POLICY "Admins can view all referrers"
ON referrers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Allow admins to manage all referrers (update, delete)
CREATE POLICY "Admins can manage all referrers"
ON referrers
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================
-- 4. FIX REFERRALS TABLE RLS (for agent dashboard)
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Referrers can view their own referrals" ON referrals;
DROP POLICY IF EXISTS "Admins can view all referrals" ON referrals;

-- Enable RLS on referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Allow referrers to view their own referrals
CREATE POLICY "Referrers can view their own referrals"
ON referrals
FOR SELECT
TO authenticated
USING (
  referrer_id IN (
    SELECT id FROM referrers WHERE user_id = auth.uid()
  )
);

-- Allow admins to view all referrals
CREATE POLICY "Admins can view all referrals"
ON referrals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================
-- 5. FIX COMMISSIONS TABLE RLS (for agent earnings)
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Referrers can view their own commissions" ON commissions;
DROP POLICY IF EXISTS "Admins can view all commissions" ON commissions;

-- Enable RLS on commissions
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Allow referrers to view their own commissions
CREATE POLICY "Referrers can view their own commissions"
ON commissions
FOR SELECT
TO authenticated
USING (
  referrer_id IN (
    SELECT id FROM referrers WHERE user_id = auth.uid()
  )
);

-- Allow admins to view all commissions
CREATE POLICY "Admins can view all commissions"
ON commissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================
-- 6. GRANT NECESSARY PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON user_roles TO authenticated;
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON referrers TO authenticated;
GRANT SELECT ON referrals TO authenticated;
GRANT SELECT ON commissions TO authenticated;
