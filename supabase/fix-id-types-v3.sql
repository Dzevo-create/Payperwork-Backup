-- Fix: Change ID columns from UUID to TEXT to support localStorage migration
-- This version cleans up orphaned references before recreating constraints

-- Step 1: Drop all foreign key constraints
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE library_items DROP CONSTRAINT IF EXISTS library_items_message_id_fkey;
ALTER TABLE library_items DROP CONSTRAINT IF EXISTS library_items_conversation_id_fkey;

-- Step 2: Change ID columns from UUID to TEXT
-- Conversations
ALTER TABLE conversations ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Messages
ALTER TABLE messages ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE messages ALTER COLUMN conversation_id TYPE TEXT USING conversation_id::TEXT;

-- Library items
ALTER TABLE library_items ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE library_items ALTER COLUMN message_id TYPE TEXT USING message_id::TEXT;
ALTER TABLE library_items ALTER COLUMN conversation_id TYPE TEXT USING conversation_id::TEXT;

-- Step 3: Clean up orphaned references
-- Set message_id to NULL where the message doesn't exist
UPDATE library_items
SET message_id = NULL
WHERE message_id IS NOT NULL
  AND message_id NOT IN (SELECT id FROM messages);

-- Set conversation_id to NULL where the conversation doesn't exist
UPDATE library_items
SET conversation_id = NULL
WHERE conversation_id IS NOT NULL
  AND conversation_id NOT IN (SELECT id FROM conversations);

-- Step 4: Delete messages that reference non-existent conversations
DELETE FROM messages
WHERE conversation_id IS NOT NULL
  AND conversation_id NOT IN (SELECT id FROM conversations);

-- Step 5: Recreate foreign key constraints
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

-- Step 6: Update comments
COMMENT ON COLUMN conversations.id IS 'Conversation ID - TEXT to support both UUIDs and timestamp IDs from localStorage';
COMMENT ON COLUMN messages.id IS 'Message ID - TEXT to support both UUIDs and timestamp IDs from localStorage';
COMMENT ON COLUMN messages.conversation_id IS 'Reference to conversation - TEXT to support both UUIDs and timestamp IDs';

-- Done! Orphaned references cleaned up and IDs are now TEXT
