-- Migration: Add SuperChat flag to conversations
-- Created: 2025-01-17
-- Description: Add is_superchat_enabled column to track which conversations use SuperChat/C1

-- Add is_superchat_enabled column
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS is_superchat_enabled BOOLEAN DEFAULT FALSE;

-- Add index for SuperChat conversations
CREATE INDEX IF NOT EXISTS idx_conversations_is_superchat_enabled
  ON conversations(is_superchat_enabled) WHERE is_superchat_enabled = true;

-- Add comment
COMMENT ON COLUMN conversations.is_superchat_enabled IS 'Whether this conversation uses SuperChat (C1/Thesys) mode';
