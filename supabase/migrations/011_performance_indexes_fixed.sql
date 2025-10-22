-- ============================================
-- Migration 011: Performance Indexes (Fixed)
-- ============================================
-- This migration adds database indexes to improve query performance,
-- especially for RLS (Row Level Security) policy checks.
--
-- IMPORTANT: This version checks for column existence first
--
-- Created: 2025-10-22
-- Updated: 2025-10-22 (Fixed for actual schema)
-- ============================================

-- ============================================
-- STEP 1: User ID Indexes for RLS Performance
-- ============================================
-- These indexes significantly improve RLS policy checks
-- that filter by user_id

-- Index for conversations.user_id
CREATE INDEX IF NOT EXISTS idx_conversations_user_id
ON conversations(user_id);

COMMENT ON INDEX idx_conversations_user_id IS
'Improves RLS policy performance for user_id filtering';

-- Index for library_items.user_id
CREATE INDEX IF NOT EXISTS idx_library_items_user_id
ON library_items(user_id);

COMMENT ON INDEX idx_library_items_user_id IS
'Improves RLS policy performance for user_id filtering';

-- Index for branding.user_id (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'branding'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_branding_user_id ON branding(user_id);
    RAISE NOTICE 'Created index: idx_branding_user_id';
  ELSE
    RAISE NOTICE 'Table branding does not exist, skipping index';
  END IF;
END $$;

-- ============================================
-- STEP 2: Foreign Key Indexes for Joins
-- ============================================
-- These indexes improve JOIN performance for nested RLS checks

-- Index for messages.conversation_id
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
ON messages(conversation_id);

COMMENT ON INDEX idx_messages_conversation_id IS
'Improves JOIN performance for nested RLS checks on messages';

-- ============================================
-- STEP 3: Timestamp/Date Indexes (if columns exist)
-- ============================================
-- Check which timestamp columns exist and create indexes

DO $$
BEGIN
  -- Check for created_at in conversations
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
    RAISE NOTICE 'Created index: idx_conversations_created_at';
  ELSE
    RAISE NOTICE 'Column conversations.created_at does not exist, skipping';
  END IF;

  -- Check for updated_at in conversations
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'updated_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
    RAISE NOTICE 'Created index: idx_conversations_updated_at';
  END IF;

  -- Check for created_at in messages
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'messages'
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
    RAISE NOTICE 'Created index: idx_messages_created_at';
  END IF;

  -- Check for created_at in library_items
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'library_items'
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_library_items_created_at ON library_items(created_at DESC);
    RAISE NOTICE 'Created index: idx_library_items_created_at';
  END IF;
END $$;

-- ============================================
-- STEP 4: Compound Indexes (Smart - checks columns first)
-- ============================================

DO $$
BEGIN
  -- Compound index for conversations: user_id + timestamp
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_user_created
    ON conversations(user_id, created_at DESC);
    RAISE NOTICE 'Created index: idx_conversations_user_created';
  ELSIF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'updated_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
    ON conversations(user_id, updated_at DESC);
    RAISE NOTICE 'Created index: idx_conversations_user_updated';
  END IF;

  -- Compound index for messages: conversation_id + timestamp
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'messages'
    AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
    ON messages(conversation_id, created_at);
    RAISE NOTICE 'Created index: idx_messages_conversation_created';
  END IF;

  -- Compound index for library_items: user_id + type (if type column exists)
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'library_items'
    AND column_name = 'type'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_library_items_user_type ON library_items(user_id, type);
    RAISE NOTICE 'Created index: idx_library_items_user_type';
  END IF;
END $$;

-- ============================================
-- STEP 5: Analyze Tables After Index Creation
-- ============================================
-- Update table statistics for query planner

ANALYZE conversations;
ANALYZE messages;
ANALYZE library_items;

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'branding'
  ) THEN
    EXECUTE 'ANALYZE branding';
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Show all created indexes

DO $$
DECLARE
  index_info RECORD;
  index_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Index Verification ===';
  RAISE NOTICE '';

  FOR index_info IN
    SELECT
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    ORDER BY tablename, indexname
  LOOP
    RAISE NOTICE 'Table: %, Index: %', index_info.tablename, index_info.indexname;
    index_count := index_count + 1;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== Total Indexes Created: % ===', index_count;
  RAISE NOTICE '';
END $$;

-- ============================================
-- SHOW ACTUAL TABLE STRUCTURE
-- ============================================
-- This helps understand what columns exist

DO $$
DECLARE
  col_info RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== Table Structure ===';
  RAISE NOTICE '';

  FOR col_info IN
    SELECT
      table_name,
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name IN ('conversations', 'messages', 'library_items', 'branding')
    ORDER BY table_name, ordinal_position
  LOOP
    RAISE NOTICE 'Table: %, Column: %, Type: %',
      col_info.table_name,
      col_info.column_name,
      col_info.data_type;
  END LOOP;

  RAISE NOTICE '';
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Performance indexes migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Review the indexes created above';
  RAISE NOTICE '2. Monitor query performance';
  RAISE NOTICE '3. Check index usage with: SELECT * FROM pg_stat_user_indexes WHERE schemaname = ''public'';';
END $$;
