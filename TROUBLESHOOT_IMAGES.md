# 🔍 Troubleshooting Property Images Not Showing

## Quick Test Steps:

### Step 1: Check Storage Bucket Exists
1. Go to **Supabase Dashboard** → **Storage**
2. Verify you see a bucket named: `property-images`
3. Verify it shows **Public** badge (green)
4. If not public, click on it → Settings → Make it Public

### Step 2: Test Manual Upload
1. Click on `property-images` bucket
2. Try uploading a test image manually
3. If you get an error → Policies are missing
4. If it uploads → Click on the image and copy the URL
5. Open that URL in a new browser tab
6. If you can see the image → Storage is working ✅

### Step 3: Check Policies
Click on `property-images` → **Policies** tab

You should see **2 policies**:
- ✅ One for **INSERT** (upload)
- ✅ One for **SELECT** (view)

If missing, add them:

**Policy 1 - Upload:**
```sql
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');
```

**Policy 2 - View:**
```sql
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');
```

### Step 4: Watch Browser Console
1. Open your site
2. Press **F12** (Developer Tools)
3. Go to **Console** tab
4. Try adding a property
5. Look for messages:
   - ✅ "Uploading image to: properties/..."
   - ✅ "Image uploaded successfully: [URL]"
   - ❌ "Upload error: ..." ← If you see this, read the error

### Step 5: Check What's in Database
Run this in Supabase SQL Editor:
```sql
SELECT property_name, featured_image 
FROM properties 
ORDER BY created_at DESC 
LIMIT 5;
```

Check the `featured_image` column:
- ✅ Should be a URL like: `https://[project].supabase.co/storage/v1/object/public/property-images/...`
- ❌ If it's the Unsplash URL → Upload failed, using fallback

### Step 6: Test Image URL
1. Copy the `featured_image` URL from database
2. Open it in a new browser tab
3. ✅ If image loads → Storage is working, issue is elsewhere
4. ❌ If 404 or error → Storage policies are wrong

---

## Common Issues & Fixes:

### Issue 1: "Bucket not found"
**Fix:** Create the bucket:
- Name: `property-images` (lowercase, with dash)
- Public: ✅ Must check this box

### Issue 2: "New row violates policy"
**Fix:** Add the upload policy (Policy 1 above)

### Issue 3: Images show placeholder
**Cause:** Upload is failing silently
**Fix:** Check browser console for error message

### Issue 4: "Access denied" when viewing image
**Fix:** Add the view policy (Policy 2 above)

### Issue 5: CORS errors
**Fix:** Make sure bucket is truly **Public**

---

## What You Should See When It Works:

1. **During upload:**
   - Toast: "Image uploaded successfully!"
   - Console: Full URL logged

2. **In database:**
   - `featured_image` = `https://[your-project].supabase.co/storage/v1/object/public/property-images/properties/[timestamp]-[random].jpg`

3. **On homepage:**
   - Real uploaded image appears
   - NOT the Unsplash placeholder

---

## Still Not Working?

### Check This:
1. Is bucket really public? (has green Public badge)
2. Are BOTH policies added? (INSERT + SELECT)
3. Does manual upload work in the dashboard?
4. What error shows in browser console?

### Quick Fix - Use Simple Policy:
If nothing works, try this simpler approach in SQL Editor:

```sql
-- Delete existing policies
DELETE FROM storage.policies WHERE bucket_id = 'property-images';

-- Add simple public access
CREATE POLICY "Anyone can do anything with property images"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'property-images')
WITH CHECK (bucket_id = 'property-images');
```

This gives full public access (not ideal for production, but good for testing).

---

**Try adding a property again after these checks and watch the console!** 🔍
