-- Migration: Add missing fields for messages and library_items tables
-- Created: 2025-01-XX
-- Description: Adds Super Chat (C1) tracking fields and generation metadata to messages table,
--              and is_favorite field to library_items table

-- =======================
-- MESSAGES TABLE UPDATES
-- =======================

-- Add missing fields to messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS was_generated_with_c1 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS generation_type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS generation_attempt INTEGER,
  ADD COLUMN IF NOT EXISTS generation_max_attempts INTEGER,
  ADD COLUMN IF NOT EXISTS is_c1_streaming BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reply_to JSONB;

-- Add CHECK constraint for generation_type
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_generation_type_check;
ALTER TABLE messages
  ADD CONSTRAINT messages_generation_type_check
  CHECK (generation_type IN ('image', 'video', 'text'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_was_generated_with_c1 ON messages(was_generated_with_c1);
CREATE INDEX IF NOT EXISTS idx_messages_generation_type ON messages(generation_type);

-- Add comments to document the fields
COMMENT ON COLUMN messages.was_generated_with_c1 IS 'True if message was created with Super Chat (C1) enabled';
COMMENT ON COLUMN messages.generation_type IS 'Type of generation: image, video, or text';
COMMENT ON COLUMN messages.generation_attempt IS 'Current attempt number for retries';
COMMENT ON COLUMN messages.generation_max_attempts IS 'Maximum number of retry attempts';
COMMENT ON COLUMN messages.is_c1_streaming IS 'True if C1 response is still being buffered';
COMMENT ON COLUMN messages.reply_to IS 'JSONB object containing messageId and content of the message being replied to';

-- ============================
-- LIBRARY_ITEMS TABLE UPDATES
-- ============================

-- Add missing is_favorite field to library_items table
ALTER TABLE library_items
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Add comment to document the field
COMMENT ON COLUMN library_items.is_favorite IS 'True if user has marked this item as favorite';
