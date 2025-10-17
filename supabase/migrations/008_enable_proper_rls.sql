-- =====================================================
-- Migration 008: Enable Proper RLS Security
-- =====================================================
-- This migration enables proper Row Level Security with user isolation
--
-- IMPORTANT: Apply this AFTER updating the Supabase client code
-- to call set_user_id() before queries!
--
-- Created: 2025-10-16
-- =====================================================

-- =====================================================
-- STEP 1: Create Helper Function for User Context
-- =====================================================

-- This function sets the user_id in the session context
-- Must be called before each query from the client
CREATE OR REPLACE FUNCTION set_user_id(user_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.user_id', user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION set_user_id(text) TO authenticated, anon, service_role;

COMMENT ON FUNCTION set_user_id IS 'Sets the user_id in session context for RLS policies';

-- =====================================================
-- STEP 2: Drop Insecure "Allow All" Policies
-- =====================================================

-- Drop the insecure policies that allow all operations
DROP POLICY IF EXISTS "Allow all for conversations" ON conversations;
DROP POLICY IF EXISTS "Allow all for messages" ON messages;
DROP POLICY IF EXISTS "Allow all for library_items" ON library_items;

-- =====================================================
-- STEP 3: Create Proper RLS Policies for CONVERSATIONS
-- =====================================================

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
ON conversations FOR SELECT
USING (user_id = current_setting('app.user_id', true));

-- Users can insert their own conversations
CREATE POLICY "Users can insert own conversations"
ON conversations FOR INSERT
WITH CHECK (user_id = current_setting('app.user_id', true));

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
ON conversations FOR UPDATE
USING (user_id = current_setting('app.user_id', true))
WITH CHECK (user_id = current_setting('app.user_id', true));

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
ON conversations FOR DELETE
USING (user_id = current_setting('app.user_id', true));

-- =====================================================
-- STEP 4: Create Proper RLS Policies for MESSAGES
-- =====================================================

-- Users can view messages from their own conversations
CREATE POLICY "Users can view messages from own conversations"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id = current_setting('app.user_id', true)
  )
);

-- Users can insert messages to their own conversations
CREATE POLICY "Users can insert messages to own conversations"
ON messages FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id = current_setting('app.user_id', true)
  )
);

-- Users can update messages in their own conversations
CREATE POLICY "Users can update messages in own conversations"
ON messages FOR UPDATE
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id = current_setting('app.user_id', true)
  )
)
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id = current_setting('app.user_id', true)
  )
);

-- Users can delete messages from their own conversations
CREATE POLICY "Users can delete messages from own conversations"
ON messages FOR DELETE
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id = current_setting('app.user_id', true)
  )
);

-- =====================================================
-- STEP 5: Create Proper RLS Policies for LIBRARY_ITEMS
-- =====================================================

-- Users can view their own library items
CREATE POLICY "Users can view own library items"
ON library_items FOR SELECT
USING (user_id = current_setting('app.user_id', true));

-- Users can insert their own library items
CREATE POLICY "Users can insert own library items"
ON library_items FOR INSERT
WITH CHECK (user_id = current_setting('app.user_id', true));

-- Users can update their own library items
CREATE POLICY "Users can update own library items"
ON library_items FOR UPDATE
USING (user_id = current_setting('app.user_id', true))
WITH CHECK (user_id = current_setting('app.user_id', true));

-- Users can delete their own library items
CREATE POLICY "Users can delete own library items"
ON library_items FOR DELETE
USING (user_id = current_setting('app.user_id', true));

-- =====================================================
-- STEP 6: Enable RLS on SKETCH_TO_RENDER Table
-- =====================================================

-- Check if sketch_to_render table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'sketch_to_render'
  ) THEN
    -- Enable RLS
    ALTER TABLE sketch_to_render ENABLE ROW LEVEL SECURITY;

    -- Create policies
    EXECUTE 'CREATE POLICY "Users can view own sketch_to_render" ON sketch_to_render FOR SELECT USING (user_id = current_setting(''app.user_id'', true))';
    EXECUTE 'CREATE POLICY "Users can insert own sketch_to_render" ON sketch_to_render FOR INSERT WITH CHECK (user_id = current_setting(''app.user_id'', true))';
    EXECUTE 'CREATE POLICY "Users can update own sketch_to_render" ON sketch_to_render FOR UPDATE USING (user_id = current_setting(''app.user_id'', true)) WITH CHECK (user_id = current_setting(''app.user_id'', true))';
    EXECUTE 'CREATE POLICY "Users can delete own sketch_to_render" ON sketch_to_render FOR DELETE USING (user_id = current_setting(''app.user_id'', true))';

    RAISE NOTICE 'RLS enabled on sketch_to_render table';
  ELSE
    RAISE NOTICE 'sketch_to_render table does not exist, skipping';
  END IF;
END
$$;

-- =====================================================
-- STEP 7: Storage Policies (Images & Videos Buckets)
-- =====================================================
-- NOTE: Storage policies MUST be created via Supabase Dashboard, not SQL
-- because storage.objects table is owned by supabase_storage_admin
--
-- After running this migration, go to:
-- Dashboard → Storage → Policies → Create Policy
--
-- For "images" bucket:
--   Policy Name: "Users can access own images"
--   Allowed operations: SELECT, INSERT, UPDATE, DELETE
--   Target roles: authenticated
--   USING expression: (storage.foldername(name))[1] = auth.uid()::text
--   WITH CHECK expression: (storage.foldername(name))[1] = auth.uid()::text
--
-- For "videos" bucket:
--   Policy Name: "Users can access own videos"
--   Allowed operations: SELECT, INSERT, UPDATE, DELETE
--   Target roles: authenticated
--   USING expression: (storage.foldername(name))[1] = auth.uid()::text
--   WITH CHECK expression: (storage.foldername(name))[1] = auth.uid()::text
--
-- IMPORTANT: Storage uses auth.uid() instead of current_setting('app.user_id')
-- because storage operations don't go through our set_user_id() function.
-- =====================================================

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify RLS is enabled on all tables
DO $$
DECLARE
  rls_status RECORD;
BEGIN
  RAISE NOTICE '=== RLS Status Check ===';

  FOR rls_status IN
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('conversations', 'messages', 'library_items', 'sketch_to_render')
  LOOP
    RAISE NOTICE 'Table: %, RLS Enabled: %', rls_status.tablename, rls_status.rowsecurity;
  END LOOP;

  RAISE NOTICE '=== End RLS Status ===';
END
$$;

-- =====================================================
-- ROLLBACK PLAN (In case of issues)
-- =====================================================
-- If you need to rollback to "allow all" mode:
--
-- DROP POLICY "Users can view own conversations" ON conversations;
-- DROP POLICY "Users can insert own conversations" ON conversations;
-- DROP POLICY "Users can update own conversations" ON conversations;
-- DROP POLICY "Users can delete own conversations" ON conversations;
-- CREATE POLICY "Allow all for conversations" ON conversations FOR ALL USING (true);
--
-- (Repeat for messages, library_items, sketch_to_render, storage.objects)
-- =====================================================
