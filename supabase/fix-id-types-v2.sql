-- Fix: Change ID columns from UUID to TEXT to support localStorage migration
-- localStorage uses timestamp strings like "1760286054149" instead of UUIDs

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

-- Step 3: Recreate foreign key constraints
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

-- Step 4: Update comments
COMMENT ON COLUMN conversations.id IS 'Conversation ID - TEXT to support both UUIDs and timestamp IDs from localStorage';
COMMENT ON COLUMN messages.id IS 'Message ID - TEXT to support both UUIDs and timestamp IDs from localStorage';
COMMENT ON COLUMN messages.conversation_id IS 'Reference to conversation - TEXT to support both UUIDs and timestamp IDs';

-- Done! Now your localStorage IDs (timestamps) will work in Supabase
