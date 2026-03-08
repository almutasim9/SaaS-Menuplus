-- Create the storage bucket for product images and assets
-- Simplified version without the 'public' column
INSERT INTO storage.buckets (id, name)
VALUES ('menu-assets', 'menu-assets')
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all objects in the bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-assets');

-- Allow authenticated users to upload new objects
CREATE POLICY "Authenticated users can upload objects"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-assets');

-- Allow authenticated users to update objects
CREATE POLICY "Authenticated users can update objects"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-assets');
