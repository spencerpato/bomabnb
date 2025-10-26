# URGENT: Apply This SQL to Fix Agent Registration

## The Problem
- **Agent registration is failing** with error: "new row violates row-level security policy for table 'user_roles'"
- **Admin dashboard not showing agent data** because of restrictive RLS policies

## The Solution
You need to apply the SQL migration in `supabase/migrations/20251026_fix_rls_policies.sql` to your Supabase database.

## How to Apply (Choose ONE method):

### Method 1: Supabase Dashboard (Easiest - 2 minutes)
1. Go to https://supabase.com/dashboard
2. Select your project: `dgffjmbbzamwydpwxwkm`
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. **Copy ALL the SQL** from `supabase/migrations/20251026_fix_rls_policies.sql`
6. **Paste it** into the SQL editor
7. Click **"Run"** (or press Ctrl+Enter)
8. ✅ Done! Test agent registration

### Method 2: Supabase CLI (If you have it installed)
```bash
# Link to your project
supabase link --project-ref dgffjmbbzamwydpwxwkm

# Apply the migration
supabase db push
```

### Method 3: Quick Fix - Run This SQL Directly
If you just want the essential fixes, run this shorter version:

```sql
-- Fix user_roles table to allow agent registration
DROP POLICY IF EXISTS "Users can insert their own role during registration" ON user_roles;
CREATE POLICY "Users can insert their own role during registration"
ON user_roles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix profiles table for admin access
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fix referrers table for admin access
DROP POLICY IF EXISTS "Admins can view all referrers" ON referrers;
CREATE POLICY "Admins can view all referrers"
ON referrers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fix referrals table for admin access
DROP POLICY IF EXISTS "Admins can view all referrals" ON referrals;
CREATE POLICY "Admins can view all referrals"
ON referrals FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fix commissions table for admin access
DROP POLICY IF EXISTS "Admins can view all commissions" ON commissions;
CREATE POLICY "Admins can view all commissions"
ON commissions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

## What This SQL Does:
1. ✅ Allows users to register as agents (fixes the RLS error)
2. ✅ Allows admins to view all agent data
3. ✅ Allows agents to view their own data
4. ✅ Secures the database with proper row-level security

## After Applying:
1. Try registering a new agent - it should work!
2. Log in as admin - you should see all agent details
3. Everything should work smoothly 🎉
