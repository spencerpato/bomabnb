-- Setup storage policies for property-images bucket
-- Note: You must create the bucket 'property-images' manually first in Supabase Dashboard → Storage

-- Policy 1: Allow authenticated users to upload property images
INSERT INTO storage.policies (name, bucket_id, definition, check)
VALUES (
  'Allow authenticated users to upload property images',
  'property-images',
  '(bucket_id = ''property-images''::text)',
  '(bucket_id = ''property-images''::text)'
)
ON CONFLICT DO NOTHING;

-- Policy 2: Allow public to view property images  
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Allow public to view property images',
  'property-images', 
  '(bucket_id = ''property-images''::text)'
)
ON CONFLICT DO NOTHING;

-- Alternative: Use storage.objects policies (if above doesn't work)

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Allow public to view
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');
