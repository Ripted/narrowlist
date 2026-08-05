DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
CREATE POLICY "Users can upload their own profile images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (auth.uid())::text = (storage.foldername(name))[1]
    AND lower(name) ~ '\.(jpg|jpeg|png|gif|webp|avif)$'
  );

DROP POLICY IF EXISTS "Admins can upload level thumbnails" ON storage.objects;
CREATE POLICY "Admins can upload level thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'level-thumbnails'
    AND public.has_role(auth.uid(), 'admin'::app_role)
    AND lower(name) ~ '\.(jpg|jpeg|png|gif|webp|avif)$'
  );