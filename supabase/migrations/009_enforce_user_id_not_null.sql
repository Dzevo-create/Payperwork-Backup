-- =====================================================
-- Migration 009: Enforce user_id NOT NULL
-- =====================================================
-- This migration ensures data integrity by making
-- user_id NOT NULL in all tables and adding DEFAULT values
--
-- Created: 2025-10-17
-- Author: Claude Code
-- =====================================================

-- =====================================================
-- STEP 1: Check for existing NULL user_id values
-- =====================================================
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  RAISE NOTICE '=== Checking for NULL user_id values ===';

  -- Check conversations
  SELECT COUNT(*) INTO null_count FROM conversations WHERE user_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Found % conversations with NULL user_id! Please fix these first.', null_count;
  END IF;
  RAISE NOTICE 'conversations: ✓ OK (no NULL values)';

  -- Check library_items
  SELECT COUNT(*) INTO null_count FROM library_items WHERE user_id IS NULL;
  IF null_count > 0 THEN
    RAISE WARNING 'Found % library_items with NULL user_id - these will be deleted!', null_count;
    DELETE FROM library_items WHERE user_id IS NULL;
    RAISE NOTICE 'Deleted % orphaned library_items', null_count;
  END IF;
  RAISE NOTICE 'library_items: ✓ OK';

  -- Check sketch_to_render
  SELECT COUNT(*) INTO null_count FROM sketch_to_render WHERE user_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Found % sketch_to_render with NULL user_id! Please fix these first.', null_count;
  END IF;
  RAISE NOTICE 'sketch_to_render: ✓ OK';

  -- Check branding
  SELECT COUNT(*) INTO null_count FROM branding WHERE user_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Found % branding with NULL user_id! Please fix these first.', null_count;
  END IF;
  RAISE NOTICE 'branding: ✓ OK';

  RAISE NOTICE '=== All checks passed ===';
END $$;

-- =====================================================
-- STEP 2: Add NOT NULL constraints (if not already present)
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== Adding NOT NULL constraints ===';

  -- conversations.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name = 'user_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE conversations ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE 'conversations.user_id: ✓ NOT NULL constraint added';
  ELSE
    RAISE NOTICE 'conversations.user_id: ✓ Already NOT NULL';
  END IF;

  -- library_items.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'library_items'
    AND column_name = 'user_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE library_items ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE 'library_items.user_id: ✓ NOT NULL constraint added';
  ELSE
    RAISE NOTICE 'library_items.user_id: ✓ Already NOT NULL';
  END IF;

  -- sketch_to_render.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sketch_to_render'
    AND column_name = 'user_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE sketch_to_render ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE 'sketch_to_render.user_id: ✓ NOT NULL constraint added';
  ELSE
    RAISE NOTICE 'sketch_to_render.user_id: ✓ Already NOT NULL';
  END IF;

  -- branding.user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'branding'
    AND column_name = 'user_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE branding ALTER COLUMN user_id SET NOT NULL;
    RAISE NOTICE 'branding.user_id: ✓ NOT NULL constraint added';
  ELSE
    RAISE NOTICE 'branding.user_id: ✓ Already NOT NULL';
  END IF;
END $$;

-- =====================================================
-- STEP 3: Add DEFAULT values for safety
-- =====================================================
-- This ensures that if someone forgets to provide user_id,
-- it will use the session user_id from RLS context

DO $$
BEGIN
  RAISE NOTICE '=== Adding DEFAULT values ===';

  -- conversations
  ALTER TABLE conversations
    ALTER COLUMN user_id SET DEFAULT current_setting('app.user_id', true);
  RAISE NOTICE 'conversations.user_id: ✓ DEFAULT value added';

  -- library_items
  ALTER TABLE library_items
    ALTER COLUMN user_id SET DEFAULT current_setting('app.user_id', true);
  RAISE NOTICE 'library_items.user_id: ✓ DEFAULT value added';

  -- sketch_to_render
  ALTER TABLE sketch_to_render
    ALTER COLUMN user_id SET DEFAULT current_setting('app.user_id', true);
  RAISE NOTICE 'sketch_to_render.user_id: ✓ DEFAULT value added';

  -- branding
  ALTER TABLE branding
    ALTER COLUMN user_id SET DEFAULT current_setting('app.user_id', true);
  RAISE NOTICE 'branding.user_id: ✓ DEFAULT value added';
END $$;

-- =====================================================
-- STEP 4: Add comments for documentation
-- =====================================================
COMMENT ON COLUMN conversations.user_id IS 'User ID (NOT NULL, defaults to session user) - ensures data integrity';
COMMENT ON COLUMN library_items.user_id IS 'User ID (NOT NULL, defaults to session user) - ensures data integrity';
COMMENT ON COLUMN sketch_to_render.user_id IS 'User ID (NOT NULL, defaults to session user) - ensures data integrity';
COMMENT ON COLUMN branding.user_id IS 'User ID (NOT NULL, defaults to session user) - ensures data integrity';

-- =====================================================
-- STEP 5: Create trigger to prevent NULL user_id
-- =====================================================
-- Extra safety: Even if DEFAULT fails, this trigger will catch it

CREATE OR REPLACE FUNCTION prevent_null_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be NULL. Please provide a valid user_id or ensure set_user_id() was called.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DROP TRIGGER IF EXISTS prevent_null_user_id_conversations ON conversations;
CREATE TRIGGER prevent_null_user_id_conversations
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION prevent_null_user_id();

DROP TRIGGER IF EXISTS prevent_null_user_id_library ON library_items;
CREATE TRIGGER prevent_null_user_id_library
  BEFORE INSERT OR UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION prevent_null_user_id();

DROP TRIGGER IF EXISTS prevent_null_user_id_sketch ON sketch_to_render;
CREATE TRIGGER prevent_null_user_id_sketch
  BEFORE INSERT OR UPDATE ON sketch_to_render
  FOR EACH ROW EXECUTE FUNCTION prevent_null_user_id();

DROP TRIGGER IF EXISTS prevent_null_user_id_branding ON branding;
CREATE TRIGGER prevent_null_user_id_branding
  BEFORE INSERT OR UPDATE ON branding
  FOR EACH ROW EXECUTE FUNCTION prevent_null_user_id();

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
DECLARE
  constraint_check RECORD;
BEGIN
  RAISE NOTICE '=== Verification ===';

  FOR constraint_check IN
    SELECT table_name, column_name, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'user_id'
    AND table_name IN ('conversations', 'library_items', 'sketch_to_render', 'branding')
    ORDER BY table_name
  LOOP
    RAISE NOTICE 'Table: %, Column: %, Nullable: %, Default: %',
      constraint_check.table_name,
      constraint_check.column_name,
      constraint_check.is_nullable,
      COALESCE(constraint_check.column_default, 'none');
  END LOOP;

  RAISE NOTICE '=== End Verification ===';
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ Migration 009 completed successfully!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ All user_id columns are now NOT NULL';
  RAISE NOTICE '✅ DEFAULT values added for safety';
  RAISE NOTICE '✅ Triggers added to prevent NULL values';
  RAISE NOTICE '✅ Data integrity is now guaranteed!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- ROLLBACK PLAN (In case of issues)
-- =====================================================
-- If you need to rollback:
--
-- ALTER TABLE conversations ALTER COLUMN user_id DROP NOT NULL;
-- ALTER TABLE library_items ALTER COLUMN user_id DROP NOT NULL;
-- ALTER TABLE sketch_to_render ALTER COLUMN user_id DROP NOT NULL;
-- ALTER TABLE branding ALTER COLUMN user_id DROP NOT NULL;
--
-- DROP TRIGGER IF EXISTS prevent_null_user_id_conversations ON conversations;
-- DROP TRIGGER IF EXISTS prevent_null_user_id_library ON library_items;
-- DROP TRIGGER IF EXISTS prevent_null_user_id_sketch ON sketch_to_render;
-- DROP TRIGGER IF EXISTS prevent_null_user_id_branding ON branding;
-- DROP FUNCTION IF EXISTS prevent_null_user_id();
-- =====================================================
