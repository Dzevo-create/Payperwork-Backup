-- Fix message_id and conversation_id to accept TEXT instead of UUID
-- Because the app uses timestamp-based IDs, not UUIDs

-- Drop the foreign key constraints first
ALTER TABLE library_items DROP CONSTRAINT IF EXISTS library_items_message_id_fkey;
ALTER TABLE library_items DROP CONSTRAINT IF EXISTS library_items_conversation_id_fkey;

-- Change column types from UUID to TEXT
ALTER TABLE library_items ALTER COLUMN message_id TYPE TEXT USING message_id::TEXT;
ALTER TABLE library_items ALTER COLUMN conversation_id TYPE TEXT USING conversation_id::TEXT;

-- Optionally add back foreign keys if needed (commented out for now since IDs might not match)
-- ALTER TABLE library_items ADD CONSTRAINT library_items_message_id_fkey
--   FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL;
-- ALTER TABLE library_items ADD CONSTRAINT library_items_conversation_id_fkey
--   FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;
