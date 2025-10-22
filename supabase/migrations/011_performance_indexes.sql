-- ============================================
-- Migration 011: Performance Indexes
-- ============================================
-- This migration adds database indexes to improve query performance,
-- especially for RLS (Row Level Security) policy checks.
--
-- Created: 2025-10-22
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

-- Index for branding.user_id
CREATE INDEX IF NOT EXISTS idx_branding_user_id
ON branding(user_id);

COMMENT ON INDEX idx_branding_user_id IS
'Improves RLS policy performance for user_id filtering';

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
-- STEP 3: Timestamp Indexes for Sorting
-- ============================================
-- These indexes improve queries that sort by timestamp

-- Index for conversations.created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_conversations_created_at
ON conversations(created_at DESC);

COMMENT ON INDEX idx_conversations_created_at IS
'Improves performance for queries sorting by creation date';

-- Index for messages.created_at (for sorting within conversations)
CREATE INDEX IF NOT EXISTS idx_messages_created_at
ON messages(created_at DESC);

COMMENT ON INDEX idx_messages_created_at IS
'Improves performance for queries sorting messages by date';

-- Index for library_items.created_at (for library sorting)
CREATE INDEX IF NOT EXISTS idx_library_items_created_at
ON library_items(created_at DESC);

COMMENT ON INDEX idx_library_items_created_at IS
'Improves performance for library queries sorted by date';

-- ============================================
-- STEP 4: Compound Indexes for Common Queries
-- ============================================
-- These indexes optimize commonly run queries

-- Compound index for conversations: user_id + created_at
-- Optimizes: SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_conversations_user_created
ON conversations(user_id, created_at DESC);

COMMENT ON INDEX idx_conversations_user_created IS
'Optimizes user conversations queries with date sorting';

-- Compound index for messages: conversation_id + created_at
-- Optimizes: SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at);

COMMENT ON INDEX idx_messages_conversation_created IS
'Optimizes conversation messages queries with date sorting';

-- Compound index for library_items: user_id + type + created_at
-- Optimizes: SELECT * FROM library_items WHERE user_id = ? AND type = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_library_items_user_type_created
ON library_items(user_id, type, created_at DESC);

COMMENT ON INDEX idx_library_items_user_type_created IS
'Optimizes library queries filtered by type with date sorting';

-- ============================================
-- STEP 5: Partial Indexes (Optional)
-- ============================================
-- Partial indexes for common filter conditions

-- Index for active conversations (if you have an archived flag)
-- CREATE INDEX IF NOT EXISTS idx_conversations_active
-- ON conversations(user_id, created_at DESC)
-- WHERE archived = false;

-- ============================================
-- STEP 6: Analyze Tables After Index Creation
-- ============================================
-- Update table statistics for query planner

ANALYZE conversations;
ANALYZE messages;
ANALYZE library_items;
ANALYZE branding;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check all indexes

DO $$
DECLARE
  index_info RECORD;
BEGIN
  RAISE NOTICE '=== Index Verification ===';

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
  END LOOP;

  RAISE NOTICE '=== End Index List ===';
END
$$;

-- ============================================
-- PERFORMANCE TESTING QUERIES
-- ============================================
-- Run these to verify index usage

-- Test 1: Check if index is used for user conversations
-- EXPLAIN ANALYZE
-- SELECT * FROM conversations
-- WHERE user_id = 'test-user-id'
-- ORDER BY created_at DESC
-- LIMIT 20;
-- Expected: Should use idx_conversations_user_created

-- Test 2: Check if index is used for conversation messages
-- EXPLAIN ANALYZE
-- SELECT * FROM messages
-- WHERE conversation_id = 'test-conversation-id'
-- ORDER BY created_at;
-- Expected: Should use idx_messages_conversation_created

-- Test 3: Check if index is used for library items by type
-- EXPLAIN ANALYZE
-- SELECT * FROM library_items
-- WHERE user_id = 'test-user-id'
-- AND type = 'image'
-- ORDER BY created_at DESC;
-- Expected: Should use idx_library_items_user_type_created

-- ============================================
-- INDEX SIZE MONITORING
-- ============================================
-- Query to check index sizes

-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexname::regclass)) AS index_size
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND indexname LIKE 'idx_%'
-- ORDER BY pg_relation_size(indexname::regclass) DESC;

-- ============================================
-- MAINTENANCE NOTES
-- ============================================
-- Indexes need to be maintained:
-- 1. VACUUM ANALYZE regularly to keep statistics up to date
-- 2. REINDEX if indexes become bloated
-- 3. Monitor index usage with pg_stat_user_indexes
-- 4. Remove unused indexes to save space and write performance

-- Check index usage statistics:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- ============================================
-- ROLLBACK PLAN (if needed)
-- ============================================
-- To remove all indexes created by this migration:
--
-- DROP INDEX IF EXISTS idx_conversations_user_id;
-- DROP INDEX IF EXISTS idx_library_items_user_id;
-- DROP INDEX IF EXISTS idx_branding_user_id;
-- DROP INDEX IF EXISTS idx_messages_conversation_id;
-- DROP INDEX IF EXISTS idx_conversations_created_at;
-- DROP INDEX IF EXISTS idx_messages_created_at;
-- DROP INDEX IF EXISTS idx_library_items_created_at;
-- DROP INDEX IF EXISTS idx_conversations_user_created;
-- DROP INDEX IF EXISTS idx_messages_conversation_created;
-- DROP INDEX IF EXISTS idx_library_items_user_type_created;
-- ============================================
