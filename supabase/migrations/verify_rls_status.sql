-- =====================================================
-- Verify RLS Status
-- =====================================================
-- Run this to check what RLS policies are already active
-- =====================================================

-- Check if set_user_id function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_user_id'
  ) THEN
    RAISE NOTICE '✅ set_user_id() function exists';
  ELSE
    RAISE NOTICE '❌ set_user_id() function MISSING';
  END IF;
END
$$;

-- Check RLS status on tables
DO $$
DECLARE
  rls_status RECORD;
BEGIN
  RAISE NOTICE '=== RLS Status on Tables ===';

  FOR rls_status IN
    SELECT
      tablename,
      rowsecurity as rls_enabled
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('conversations', 'messages', 'library_items', 'sketch_to_render')
    ORDER BY tablename
  LOOP
    IF rls_status.rls_enabled THEN
      RAISE NOTICE '✅ Table: % - RLS ENABLED', rls_status.tablename;
    ELSE
      RAISE NOTICE '❌ Table: % - RLS DISABLED', rls_status.tablename;
    END IF;
  END LOOP;

  RAISE NOTICE '=== End RLS Status ===';
END
$$;

-- Check existing policies
DO $$
DECLARE
  policy_rec RECORD;
  table_name TEXT;
  policy_count INT;
BEGIN
  RAISE NOTICE '=== Existing RLS Policies ===';

  FOR table_name IN
    SELECT unnest(ARRAY['conversations', 'messages', 'library_items', 'sketch_to_render'])
  LOOP
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = table_name;

    RAISE NOTICE 'Table: % - Policies: %', table_name, policy_count;

    FOR policy_rec IN
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = table_name
      ORDER BY policyname
    LOOP
      RAISE NOTICE '  - % (for %)', policy_rec.policyname, policy_rec.cmd;
    END LOOP;
  END LOOP;

  RAISE NOTICE '=== End Policies ===';
END
$$;

-- Check storage policies
DO $$
DECLARE
  storage_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO storage_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
  AND tablename = 'objects';

  RAISE NOTICE '=== Storage Policies ===';
  RAISE NOTICE 'Storage policies count: %', storage_policy_count;
END
$$;
