-- Create storage bucket for level thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('level-thumbnails', 'level-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view thumbnails (public bucket)
CREATE POLICY "Level thumbnails are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'level-thumbnails');

-- Allow admins to upload thumbnails
CREATE POLICY "Admins can upload level thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'level-thumbnails' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update thumbnails
CREATE POLICY "Admins can update level thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'level-thumbnails' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete thumbnails
CREATE POLICY "Admins can delete level thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'level-thumbnails' 
  AND has_role(auth.uid(), 'admin'::app_role)
);