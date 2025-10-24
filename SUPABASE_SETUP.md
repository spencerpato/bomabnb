# 🔧 Supabase Setup Guide for BomaBnB

## Step 1: Disable Email Confirmation

### Option A: Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to: **Authentication** → **Settings** → **Email Auth**
3. Find "**Enable email confirmations**"
4. **Turn it OFF** (disable it)
5. Click "Save"

### Option B: SQL Script
Run this in SQL Editor:
```sql
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_user();
```

## Step 2: Fix RLS Policies

Run this SQL in **SQL Editor**:

```sql
-- Fix user_roles policy
DO $$ 
BEGIN
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

-- Fix partners policy
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
```

## Step 3: Create Storage Bucket for Profile Photos

1. Go to **Storage** in your Supabase dashboard
2. Click "**New Bucket**"
3. Set name as: `avatars`
4. Make it **Public** ✅
5. Click "Create Bucket"

### Add Storage Policies:

Go to the `avatars` bucket → Policies → Add these:

**Policy 1: Allow uploads**
```sql
CREATE POLICY "Anyone can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');
```

**Policy 2: Allow public read**
```sql
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

## Step 4: Verify Database Schema

Make sure you have these columns in `partners` table:
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `business_name` (text, nullable)
- `id_passport_number` (text, nullable)
- `location` (text, required)
- `about` (text, nullable)
- `status` (partner_status enum: pending/active/rejected)
- `approved_at` (timestamptz, nullable)
- `approved_by` (uuid, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

Make sure `profiles` table has:
- `avatar_url` (text, nullable)

## Step 5: Test the Flow

### Test Registration:
1. Go to `/partner-register`
2. Fill out form
3. Upload a profile photo
4. Click "Submit Application"
5. ✅ Should see success modal
6. ✅ Should redirect to homepage

### Test Login (Pending):
1. Go to `/auth`
2. Try to login with new account
3. ✅ Should see: "⏳ Your account is pending approval"
4. ✅ Should be logged out automatically

### Test Admin Approval:
1. Login as admin (via ❤️ link in footer)
2. Go to Admin Dashboard
3. ✅ Should see notification badge on "Partner Management"
4. Click "Approve" on pending partner
5. ✅ Status should change to "Active"

### Test Login (Approved):
1. Go to `/auth`
2. Login with approved partner account
3. ✅ Should see: "🎉 Welcome to your Partner Dashboard!"
4. ✅ Should redirect to partner dashboard

## 🎯 Success Checklist

- [ ] Email confirmation disabled in Supabase
- [ ] RLS policies updated (no errors when registering)
- [ ] Storage bucket `avatars` created and public
- [ ] Test registration works
- [ ] Test pending login shows warning
- [ ] Test admin sees notification badge
- [ ] Test admin can approve/reject
- [ ] Test approved login works and accesses dashboard

## 🚨 Common Issues

### Issue: "new row violates row-level security policy"
**Fix**: Run the RLS policy SQL from Step 2

### Issue: "Failed to upload photo"
**Fix**: Make sure `avatars` bucket exists and is public

### Issue: "Email confirmation required"
**Fix**: Disable email confirmation in Auth settings (Step 1)

### Issue: Partner can login even when pending
**Fix**: Clear browser cache and test again (Auth state might be cached)

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Check Supabase logs in Dashboard
3. Verify all SQL scripts ran successfully
4. Ensure storage bucket policies are correct

---

**Everything should now work perfectly! 🎉**
