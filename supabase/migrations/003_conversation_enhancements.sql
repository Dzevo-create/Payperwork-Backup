-- Migration: Conversation System Enhancements
-- Created: 2025-01-13
-- Description: Add performance and feature enhancements to conversations system

-- =======================
-- CONVERSATIONS ENHANCEMENTS
-- =======================

-- Add message count column (denormalized for performance)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

-- Add last message preview (for sidebar display)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

-- Add last message timestamp (for quick sorting without JOIN)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- Add tags/labels for categorization
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add archived flag (soft delete)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Add favorite flag (in addition to pinned)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Add conversation metadata (for extensibility)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- =======================
-- INDEXES FOR PERFORMANCE
-- =======================

-- Index for archived conversations
CREATE INDEX IF NOT EXISTS idx_conversations_is_archived
  ON conversations(is_archived) WHERE is_archived = false;

-- Index for favorite conversations
CREATE INDEX IF NOT EXISTS idx_conversations_is_favorite
  ON conversations(is_favorite) WHERE is_favorite = true;

-- Index for last message timestamp (for sorting)
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
  ON conversations(last_message_at DESC NULLS LAST);

-- Index for tags (GIN index for array queries)
CREATE INDEX IF NOT EXISTS idx_conversations_tags
  ON conversations USING GIN(tags);

-- Composite index for user + archived + updated_at (most common query)
CREATE INDEX IF NOT EXISTS idx_conversations_user_archived_updated
  ON conversations(user_id, is_archived, updated_at DESC);

-- =======================
-- TRIGGERS FOR AUTO-UPDATE
-- =======================

-- Function to update conversation metadata when messages change
CREATE OR REPLACE FUNCTION update_conversation_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Update message count and last message info
  UPDATE conversations
  SET
    message_count = (
      SELECT COUNT(*)
      FROM messages
      WHERE conversation_id = NEW.conversation_id
    ),
    last_message_preview = SUBSTRING(NEW.content, 1, 100),
    last_message_at = NEW.timestamp,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on message insert
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message_insert ON messages;
CREATE TRIGGER trigger_update_conversation_on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_metadata();

-- Function to update conversation metadata when messages are deleted
CREATE OR REPLACE FUNCTION update_conversation_on_message_delete()
RETURNS TRIGGER AS $$
DECLARE
  last_msg RECORD;
BEGIN
  -- Get the last remaining message
  SELECT content, timestamp INTO last_msg
  FROM messages
  WHERE conversation_id = OLD.conversation_id
  ORDER BY timestamp DESC
  LIMIT 1;

  -- Update conversation
  UPDATE conversations
  SET
    message_count = (
      SELECT COUNT(*)
      FROM messages
      WHERE conversation_id = OLD.conversation_id
    ),
    last_message_preview = COALESCE(SUBSTRING(last_msg.content, 1, 100), NULL),
    last_message_at = last_msg.timestamp,
    updated_at = NOW()
  WHERE id = OLD.conversation_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger on message delete
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message_delete ON messages;
CREATE TRIGGER trigger_update_conversation_on_message_delete
  AFTER DELETE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message_delete();

-- =======================
-- BACKFILL EXISTING DATA
-- =======================

-- Backfill message counts for existing conversations
UPDATE conversations c
SET message_count = (
  SELECT COUNT(*)
  FROM messages m
  WHERE m.conversation_id = c.id
);

-- Backfill last message data for existing conversations
UPDATE conversations c
SET
  last_message_preview = (
    SELECT SUBSTRING(content, 1, 100)
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.timestamp DESC
    LIMIT 1
  ),
  last_message_at = (
    SELECT timestamp
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY m.timestamp DESC
    LIMIT 1
  );

-- =======================
-- HELPFUL VIEWS
-- =======================

-- View for conversations with enriched data
CREATE OR REPLACE VIEW conversations_with_stats AS
SELECT
  c.id,
  c.title,
  c.user_id,
  c.created_at,
  c.updated_at,
  c.is_pinned,
  c.is_archived,
  c.is_favorite,
  c.tags,
  c.message_count,
  c.last_message_preview,
  c.last_message_at,
  c.metadata,
  COUNT(DISTINCT m.id) FILTER (WHERE m.generation_type = 'image') as image_count,
  COUNT(DISTINCT m.id) FILTER (WHERE m.generation_type = 'video') as video_count,
  COUNT(DISTINCT m.id) FILTER (WHERE m.was_generated_with_c1 = true) as c1_message_count
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id;

-- =======================
-- COMMENTS
-- =======================

COMMENT ON COLUMN conversations.message_count IS 'Denormalized count of messages in conversation (auto-updated via trigger)';
COMMENT ON COLUMN conversations.last_message_preview IS 'First 100 characters of last message (for sidebar preview)';
COMMENT ON COLUMN conversations.last_message_at IS 'Timestamp of last message (for sorting without JOIN)';
COMMENT ON COLUMN conversations.tags IS 'User-defined tags for categorization (e.g., ["work", "project-x"])';
COMMENT ON COLUMN conversations.is_archived IS 'Soft delete flag (archived conversations hidden by default)';
COMMENT ON COLUMN conversations.is_favorite IS 'Favorite flag (in addition to pinned)';
COMMENT ON COLUMN conversations.metadata IS 'Extensible JSONB field for future features';

-- =======================
-- HELPER FUNCTIONS
-- =======================

-- Function to archive old conversations (for maintenance/cleanup)
CREATE OR REPLACE FUNCTION archive_old_conversations(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE conversations
  SET is_archived = true
  WHERE
    updated_at < NOW() - INTERVAL '1 day' * days_old
    AND is_archived = false
    AND is_pinned = false
    AND is_favorite = false;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archive_old_conversations IS 'Archive conversations older than specified days (default 90). Skips pinned and favorite conversations.';

-- Function to get conversation summary
CREATE OR REPLACE FUNCTION get_conversation_summary(conv_id UUID)
RETURNS TABLE(
  title TEXT,
  message_count INTEGER,
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  has_images BOOLEAN,
  has_videos BOOLEAN,
  has_c1 BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.title,
    c.message_count,
    MIN(m.timestamp) as first_message_at,
    MAX(m.timestamp) as last_message_at,
    EXISTS(SELECT 1 FROM messages WHERE conversation_id = conv_id AND generation_type = 'image') as has_images,
    EXISTS(SELECT 1 FROM messages WHERE conversation_id = conv_id AND generation_type = 'video') as has_videos,
    EXISTS(SELECT 1 FROM messages WHERE conversation_id = conv_id AND was_generated_with_c1 = true) as has_c1
  FROM conversations c
  LEFT JOIN messages m ON m.conversation_id = c.id
  WHERE c.id = conv_id
  GROUP BY c.id, c.title, c.message_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_conversation_summary IS 'Get summary statistics for a specific conversation';
