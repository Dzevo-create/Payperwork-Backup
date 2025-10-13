-- FINAL FIX: Complete reset and conversion from UUID to TEXT
-- Run this if previous migrations partially failed

-- ============================================
-- STEP 1: Drop ALL constraints (even if they don't exist)
-- ============================================
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE library_items DROP CONSTRAINT IF EXISTS library_items_message_id_fkey;
ALTER TABLE library_items DROP CONSTRAINT IF EXISTS library_items_conversation_id_fkey;

-- ============================================
-- STEP 2: Clean up orphaned data BEFORE converting types
-- ============================================

-- Option A: Delete orphaned library items (safer - doesn't break constraints)
DELETE FROM library_items
WHERE message_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM messages WHERE messages.id::TEXT = library_items.message_id::TEXT);

DELETE FROM library_items
WHERE conversation_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM conversations WHERE conversations.id::TEXT = library_items.conversation_id::TEXT);

-- Delete orphaned messages
DELETE FROM messages
WHERE conversation_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM conversations WHERE conversations.id::TEXT = messages.conversation_id::TEXT);

-- ============================================
-- STEP 3: Convert UUID to TEXT
-- ============================================

-- Conversations
ALTER TABLE conversations ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Messages
ALTER TABLE messages ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE messages ALTER COLUMN conversation_id TYPE TEXT USING conversation_id::TEXT;

-- Library items
ALTER TABLE library_items ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE library_items ALTER COLUMN message_id TYPE TEXT USING message_id::TEXT;
ALTER TABLE library_items ALTER COLUMN conversation_id TYPE TEXT USING conversation_id::TEXT;

-- ============================================
-- STEP 4: Recreate constraints
-- ============================================

ALTER TABLE messages
  ADD CONSTRAINT messages_conversation_id_fkey
  FOREIGN KEY (conversation_id)
  REFERENCES conversations(id)
  ON DELETE CASCADE;

ALTER TABLE library_items
  ADD CONSTRAINT library_items_message_id_fkey
  FOREIGN KEY (message_id)
  REFERENCES messages(id)
  ON DELETE SET NULL;

ALTER TABLE library_items
  ADD CONSTRAINT library_items_conversation_id_fkey
  FOREIGN KEY (conversation_id)
  REFERENCES conversations(id)
  ON DELETE SET NULL;

-- ============================================
-- STEP 5: Add helpful comments
-- ============================================

COMMENT ON COLUMN conversations.id IS 'TEXT ID - supports both UUIDs and timestamp strings from localStorage';
COMMENT ON COLUMN messages.id IS 'TEXT ID - supports both UUIDs and timestamp strings from localStorage';
COMMENT ON COLUMN library_items.id IS 'TEXT ID - supports both UUIDs and timestamp strings from localStorage';

-- ============================================
-- DONE! Your database now accepts TEXT IDs
-- ============================================
