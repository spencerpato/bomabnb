# 🖼️ Setup Property Images Storage in Supabase

## ⚠️ IMPORTANT: Do this before adding properties!

Your uploaded property images will now be stored in Supabase Storage and display correctly on the homepage and property details.

---

## Step 1: Create Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"** (green button, top right)
3. Fill out:
   - **Name**: `property-images` (exactly this, lowercase with dash)
   - **Public bucket**: ✅ **CHECK THIS BOX** (important!)
   - **File size limit**: Leave default (50MB is fine)
4. Click **"Create bucket"**

---

## Step 2: Add Storage Policies

### **Policy 1: Allow Anyone to Upload**

1. Click on the **"property-images"** bucket
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Click **"Create policy from scratch"**
5. Fill out:
   - **Policy name**: `Allow authenticated users to upload property images`
   - **Allowed operation**: Select **INSERT** ✅
   - **Target roles**: Select **authenticated** ✅
   - **WITH CHECK expression**:
   ```sql
   bucket_id = 'property-images'
   ```
6. Click **"Review"** → **"Save policy"**

### **Policy 2: Allow Anyone to View**

1. Click **"New Policy"** again
2. Click **"Create policy from scratch"**
3. Fill out:
   - **Policy name**: `Allow public to view property images`
   - **Allowed operation**: Select **SELECT** ✅
   - **Target roles**: Select **public** ✅
   - **USING expression**:
   ```sql
   bucket_id = 'property-images'
   ```
4. Click **"Review"** → **"Save policy"**

---

## Step 3: Verify Setup

### Quick Test:
1. Go to the `property-images` bucket
2. Try manually uploading a test image
3. If it uploads successfully ✅ - You're all set!

---

## ✅ What This Does

- **Featured images** uploaded during "Add Property" will be stored in Supabase
- **Additional images** (up to 10) will also be stored
- Images will display correctly on:
  - Homepage property cards
  - Property details page
  - Property galleries

---

## 🚀 Now You Can:

1. ✅ Add properties with real images
2. ✅ Images appear on homepage
3. ✅ Images appear in property details
4. ✅ Fast uploads (images stored efficiently)
5. ✅ Public access (anyone can view property images)

---

## 📝 Notes

- Images are stored with unique filenames (timestamp + random string)
- Featured image shows as the main property card image
- Additional images appear in the property gallery
- All images are publicly accessible (needed for visitors to see them)

---

**Once you complete these steps, all uploaded property images will work perfectly!** 🎉
