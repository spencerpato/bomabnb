# Fix Property Images Storage Error

## Problem
Error: "new row violates row-level security policy"

This happens because the `property-images` storage bucket doesn't exist or doesn't have proper RLS policies.

---

## Solution: Run This SQL in Supabase

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Paste this SQL and click **Run**:

```sql
-- Create property-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public Access for Property Images" ON storage.objects;
DROP POLICY IF EXISTS "Partners can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Partners can update their property images" ON storage.objects;
DROP POLICY IF EXISTS "Partners can delete their property images" ON storage.objects;

-- Policy: Allow anyone to read property images (public bucket)
CREATE POLICY "Public Access for Property Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Partners can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to update images
CREATE POLICY "Partners can update their property images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to delete images
CREATE POLICY "Partners can delete their property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);
```

---

### Option 2: Alternative - Disable RLS (Not Recommended for Production)

If you want a quick fix for development only:

```sql
-- ⚠️ WARNING: This makes the bucket less secure. Only for testing!
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

---

### Option 3: Create Bucket via Supabase UI

1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Name: `property-images`
4. Check: ✅ **Public bucket**
5. Click **Create bucket**
6. Then run the policy SQL above

---

## Verify It Works

After running the SQL:

1. Go to your app
2. Try uploading an image in:
   - **Add Property** page
   - **My Properties** → Images button
3. You should see the image upload successfully!

---

## What Changed?

✅ **Before:** Storage bucket didn't exist or had no permissions  
✅ **After:** 
- Bucket created (`property-images`)
- Public read access (anyone can view images)
- Authenticated users can upload/update/delete
- All images are publicly accessible

---

## Troubleshooting

### Still Getting Errors?

1. **Check if bucket exists:**
   - Go to Supabase Dashboard → Storage
   - Look for `property-images` bucket
   - If not there, create it manually

2. **Check RLS policies:**
   - Go to Storage → property-images → Policies
   - Should see 4 policies listed
   - If not, rerun the SQL

3. **Check authentication:**
   - Make sure you're logged in when uploading
   - Check browser console for auth errors

4. **Test with this SQL:**
```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'property-images';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

---

## Need Help?

If still not working:
1. Check Supabase logs in Dashboard
2. Check browser console for detailed errors
3. Verify your Supabase URL and anon key in `.env`
