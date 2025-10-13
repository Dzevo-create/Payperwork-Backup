-- Fix: Change ID columns from UUID to TEXT to support localStorage migration
-- localStorage uses timestamp strings like "1760286054149" instead of UUIDs

-- Drop existing tables (only if they exist and are empty - be careful!)
-- If you have data, backup first!

-- Conversations table: Change ID from UUID to TEXT
ALTER TABLE conversations ALTER COLUMN id TYPE TEXT;
ALTER TABLE messages ALTER COLUMN conversation_id TYPE TEXT;

-- Messages table: Change ID from UUID to TEXT
ALTER TABLE messages ALTER COLUMN id TYPE TEXT;

-- Library items: Change IDs from UUID to TEXT
ALTER TABLE library_items ALTER COLUMN id TYPE TEXT;
ALTER TABLE library_items ALTER COLUMN message_id TYPE TEXT;
ALTER TABLE library_items ALTER COLUMN conversation_id TYPE TEXT;

-- Update comments
COMMENT ON COLUMN conversations.id IS 'Conversation ID - TEXT to support both UUIDs and timestamp IDs from localStorage';
COMMENT ON COLUMN messages.id IS 'Message ID - TEXT to support both UUIDs and timestamp IDs from localStorage';
COMMENT ON COLUMN messages.conversation_id IS 'Reference to conversation - TEXT to support both UUIDs and timestamp IDs';

-- Note: Indexes are still valid, TEXT can be indexed just fine
