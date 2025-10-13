-- Migration: Add C1 Support and Generation Type fields
-- Run this migration to add support for Super Chat (C1) and generation tracking

-- Add new columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS was_generated_with_c1 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS generation_type TEXT CHECK (generation_type IN ('text', 'image', 'video')),
ADD COLUMN IF NOT EXISTS generation_attempt INTEGER,
ADD COLUMN IF NOT EXISTS generation_max_attempts INTEGER,
ADD COLUMN IF NOT EXISTS is_c1_streaming BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reply_to JSONB;

-- Add index for filtering by generation type
CREATE INDEX IF NOT EXISTS idx_messages_generation_type ON messages(generation_type);

-- Add index for C1 messages
CREATE INDEX IF NOT EXISTS idx_messages_c1 ON messages(was_generated_with_c1) WHERE was_generated_with_c1 = TRUE;

-- Update existing messages to have default generation_type
UPDATE messages
SET generation_type = 'text'
WHERE generation_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN messages.was_generated_with_c1 IS 'True if message was generated using C1 Super Chat (Generative UI)';
COMMENT ON COLUMN messages.generation_type IS 'Type of generation: text (chat), image (DALL-E), or video (Kling/Sora)';
COMMENT ON COLUMN messages.generation_attempt IS 'Current attempt number for retries (used for image generation)';
COMMENT ON COLUMN messages.generation_max_attempts IS 'Maximum number of retry attempts allowed';
COMMENT ON COLUMN messages.is_c1_streaming IS 'Temporary flag indicating C1 content is still being streamed';
COMMENT ON COLUMN messages.reply_to IS 'Reference to parent message for reply threads (contains messageId and content)';
