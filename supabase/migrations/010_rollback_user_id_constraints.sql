/**
 * Migration 010: Rollback User ID NOT NULL Constraints
 *
 * REASON: Migration 009 is incompatible with localStorage-based user IDs
 * The app does NOT use Supabase Auth, it uses localStorage fake IDs
 * The RLS policies were blocking inserts with 401 Unauthorized
 * The NOT NULL constraints were causing 409 Conflict errors
 *
 * This rollback restores the original flexible schema that works with localStorage IDs
 */

-- ============================================================================
-- STEP 1: Drop the triggers that prevent NULL user_id
-- ============================================================================

DROP TRIGGER IF EXISTS prevent_null_user_id_conversations ON conversations;
DROP TRIGGER IF EXISTS prevent_null_user_id_library ON library_items;
DROP TRIGGER IF EXISTS prevent_null_user_id_sketch ON sketch_to_render;
DROP TRIGGER IF EXISTS prevent_null_user_id_branding ON branding;

-- Drop the trigger function
DROP FUNCTION IF EXISTS prevent_null_user_id();

-- ============================================================================
-- STEP 2: Remove DEFAULT values
-- ============================================================================

-- conversations
ALTER TABLE conversations
  ALTER COLUMN user_id DROP DEFAULT;

-- library_items
ALTER TABLE library_items
  ALTER COLUMN user_id DROP DEFAULT;

-- sketch_to_render
ALTER TABLE sketch_to_render
  ALTER COLUMN user_id DROP DEFAULT;

-- branding
ALTER TABLE branding
  ALTER COLUMN user_id DROP DEFAULT;

-- ============================================================================
-- STEP 3: Remove NOT NULL constraints (allow NULL again)
-- ============================================================================

-- conversations
ALTER TABLE conversations
  ALTER COLUMN user_id DROP NOT NULL;

-- library_items
ALTER TABLE library_items
  ALTER COLUMN user_id DROP NOT NULL;

-- sketch_to_render
ALTER TABLE sketch_to_render
  ALTER COLUMN user_id DROP NOT NULL;

-- branding
ALTER TABLE branding
  ALTER COLUMN user_id DROP NOT NULL;

-- ============================================================================
-- STEP 4: Simplify RLS Policies (remove auth.uid() requirement)
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view own library items" ON library_items;
DROP POLICY IF EXISTS "Users can insert own library items" ON library_items;
DROP POLICY IF EXISTS "Users can update own library items" ON library_items;
DROP POLICY IF EXISTS "Users can delete own library items" ON library_items;

DROP POLICY IF EXISTS "Users can view own sketch_to_render" ON sketch_to_render;
DROP POLICY IF EXISTS "Users can insert own sketch_to_render" ON sketch_to_render;
DROP POLICY IF EXISTS "Users can update own sketch_to_render" ON sketch_to_render;
DROP POLICY IF EXISTS "Users can delete own sketch_to_render" ON sketch_to_render;

DROP POLICY IF EXISTS "Users can view own branding" ON branding;
DROP POLICY IF EXISTS "Users can insert own branding" ON branding;
DROP POLICY IF EXISTS "Users can update own branding" ON branding;
DROP POLICY IF EXISTS "Users can delete own branding" ON branding;

-- Create PERMISSIVE policies (allow localStorage-based user_ids)
-- conversations
CREATE POLICY "Allow all operations on conversations"
  ON conversations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- library_items
CREATE POLICY "Allow all operations on library_items"
  ON library_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- sketch_to_render
CREATE POLICY "Allow all operations on sketch_to_render"
  ON sketch_to_render
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- branding
CREATE POLICY "Allow all operations on branding"
  ON branding
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- messages (already has permissive policy, but ensure it's correct)
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;
CREATE POLICY "Allow all operations on messages"
  ON messages
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 5: Drop the RPC function (not needed without auth)
-- ============================================================================

DROP FUNCTION IF EXISTS set_user_id(TEXT);

-- ============================================================================
-- VERIFICATION: Check that everything is rolled back
-- ============================================================================

-- Show table constraints (should NOT have NOT NULL on user_id)
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== Constraint Check ===';

  FOR rec IN
    SELECT
      table_name,
      column_name,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('conversations', 'library_items', 'sketch_to_render', 'branding')
      AND column_name = 'user_id'
    ORDER BY table_name
  LOOP
    RAISE NOTICE 'Table: %, Column: %, Nullable: %, Default: %',
      rec.table_name, rec.column_name, rec.is_nullable, rec.column_default;
  END LOOP;
END $$;

-- Show RLS policies (should be permissive)
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== RLS Policy Check ===';

  FOR rec IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('conversations', 'library_items', 'sketch_to_render', 'branding', 'messages')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE 'Table: %, Policy: %, Permissive: %, Command: %',
      rec.tablename, rec.policyname, rec.permissive, rec.cmd;
  END LOOP;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 010 completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Changes:';
  RAISE NOTICE '  - Removed NOT NULL constraints from user_id columns';
  RAISE NOTICE '  - Removed DEFAULT values from user_id columns';
  RAISE NOTICE '  - Removed trigger that prevented NULL user_id';
  RAISE NOTICE '  - Replaced restrictive RLS policies with permissive ones';
  RAISE NOTICE '  - Removed set_user_id() RPC function';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Result: App now works with localStorage-based user IDs';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: This means NO real user authentication!';
  RAISE NOTICE '   All data is accessible to anyone with the anon key.';
  RAISE NOTICE '   For production, implement proper Supabase Auth.';
END $$;
