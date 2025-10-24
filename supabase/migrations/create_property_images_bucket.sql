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

-- Policy: Allow authenticated partners to upload images
CREATE POLICY "Partners can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

-- Policy: Allow partners to update their own property images
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

-- Policy: Allow partners to delete their property images
CREATE POLICY "Partners can delete their property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);
