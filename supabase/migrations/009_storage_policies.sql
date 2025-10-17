-- =====================================================
-- Storage Policies for RLS
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Images Bucket Policies
-- =====================================================

-- Allow authenticated users to SELECT their own images
CREATE POLICY "authenticated_users_select_own_images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to INSERT their own images
CREATE POLICY "authenticated_users_insert_own_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to UPDATE their own images
CREATE POLICY "authenticated_users_update_own_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to DELETE their own images
CREATE POLICY "authenticated_users_delete_own_images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- Videos Bucket Policies
-- =====================================================

-- Allow authenticated users to SELECT their own videos
CREATE POLICY "authenticated_users_select_own_videos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to INSERT their own videos
CREATE POLICY "authenticated_users_insert_own_videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to UPDATE their own videos
CREATE POLICY "authenticated_users_update_own_videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to DELETE their own videos
CREATE POLICY "authenticated_users_delete_own_videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- =====================================================
-- Service Role Access (for API routes)
-- =====================================================

-- Allow service_role to manage all storage objects
CREATE POLICY "service_role_all_access"
ON storage.objects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- Verification
-- =====================================================

DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
  AND tablename = 'objects';

  RAISE NOTICE '✅ Storage policies created: % policies found', policy_count;
END
$$;
