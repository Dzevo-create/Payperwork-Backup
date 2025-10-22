-- ========================================
-- CHECK IF TABLES EXIST
-- ========================================
-- Run this FIRST to see if tables exist before running migration 016
-- ========================================

-- Check if tables exist
DO $$
DECLARE
  style_transfer_exists BOOLEAN;
  render_to_cad_exists BOOLEAN;
BEGIN
  -- Check style_transfer table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'style_transfer'
  ) INTO style_transfer_exists;

  -- Check render_to_cad table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'render_to_cad'
  ) INTO render_to_cad_exists;

  -- Report results
  IF style_transfer_exists THEN
    RAISE NOTICE '✅ style_transfer table EXISTS';
  ELSE
    RAISE NOTICE '❌ style_transfer table DOES NOT EXIST';
    RAISE NOTICE '   → Run migration 013_style_transfer_table.sql first!';
  END IF;

  IF render_to_cad_exists THEN
    RAISE NOTICE '✅ render_to_cad table EXISTS';
  ELSE
    RAISE NOTICE '❌ render_to_cad table DOES NOT EXIST';
    RAISE NOTICE '   → Run migration 015_render_to_cad_table.sql first!';
  END IF;

  -- Check RLS status if tables exist
  IF style_transfer_exists THEN
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'style_transfer'
      AND rowsecurity = true
    ) THEN
      RAISE NOTICE '✅ style_transfer has RLS ENABLED';
    ELSE
      RAISE NOTICE '⚠️ style_transfer has RLS DISABLED';
    END IF;
  END IF;

  IF render_to_cad_exists THEN
    IF EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename = 'render_to_cad'
      AND rowsecurity = true
    ) THEN
      RAISE NOTICE '✅ render_to_cad has RLS ENABLED';
    ELSE
      RAISE NOTICE '⚠️ render_to_cad has RLS DISABLED (will be enabled in migration 016)';
    END IF;
  END IF;

  -- Summary
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  IF NOT style_transfer_exists OR NOT render_to_cad_exists THEN
    RAISE NOTICE '⚠️ TABLES MISSING - Run these migrations first:';
    IF NOT style_transfer_exists THEN
      RAISE NOTICE '   1. supabase/migrations/013_style_transfer_table.sql';
    END IF;
    IF NOT render_to_cad_exists THEN
      RAISE NOTICE '   2. supabase/migrations/015_render_to_cad_table.sql';
    END IF;
    RAISE NOTICE '   3. Then run 016_fix_rls_policies_development.sql';
  ELSE
    RAISE NOTICE '✅ ALL TABLES EXIST - Safe to run migration 016';
  END IF;
  RAISE NOTICE '========================================';
END $$;
