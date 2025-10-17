-- =====================================================
-- Migration 008: Enable Proper RLS Security (Database Only)
-- =====================================================
-- This migration enables proper Row Level Security for database tables
-- Storage policies must be created separately via Dashboard
--
-- Created: 2025-10-16
-- =====================================================

-- =====================================================
-- STEP 1: Create Helper Function for User Context
-- =====================================================

CREATE OR REPLACE FUNCTION set_user_id(user_id text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.user_id', user_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_user_id(text) TO authenticated, anon, service_role;

COMMENT ON FUNCTION set_user_id IS 'Sets the user_id in session context for RLS policies';

-- =====================================================
-- STEP 2: Drop Insecure "Allow All" Policies
-- =====================================================

DROP POLICY IF EXISTS "Allow all for conversations" ON conversations;
DROP POLICY IF EXISTS "Allow all for messages" ON messages;
DROP POLICY IF EXISTS "Allow all for library_items" ON library_items;

-- =====================================================
-- STEP 3: Create Proper RLS Policies for CONVERSATIONS
-- =====================================================

CREATE POLICY "Users can view own conversations"
ON conversations FOR SELECT
USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert own conversations"
ON conversations FOR INSERT
WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update own conversations"
ON conversations FOR UPDATE
USING (user_id = current_setting('app.user_id', true))
WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete own conversations"
ON conversations FOR DELETE
USING (user_id = current_setting('app.user_id', true));

-- =====================================================
-- STEP 4: Create Proper RLS Policies for MESSAGES
-- =====================================================

CREATE POLICY "Users can view messages from own conversations"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id = current_setting('app.user_id', true)
  )
);

CREATE POLICY "Users can insert messages to own conversations"
ON messages FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id = current_setting('app.user_id', true)
  )
);

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

CREATE POLICY "Users can view own library items"
ON library_items FOR SELECT
USING (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert own library items"
ON library_items FOR INSERT
WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update own library items"
ON library_items FOR UPDATE
USING (user_id = current_setting('app.user_id', true))
WITH CHECK (user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can delete own library items"
ON library_items FOR DELETE
USING (user_id = current_setting('app.user_id', true));

-- =====================================================
-- STEP 6: Enable RLS on SKETCH_TO_RENDER Table
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'sketch_to_render'
  ) THEN
    ALTER TABLE sketch_to_render ENABLE ROW LEVEL SECURITY;

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
-- VERIFICATION
-- =====================================================

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
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database RLS policies successfully created!';
  RAISE NOTICE '⚠️  NEXT STEP: Create Storage policies via Dashboard';
  RAISE NOTICE 'Go to: Dashboard → Storage → images bucket → Policies → New Policy';
END
$$;
