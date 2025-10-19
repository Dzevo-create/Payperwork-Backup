-- ============================================
-- Manus Tasks Table - Add Missing Columns
-- Adds presentation_id and webhook_data columns
-- Date: 2025-10-19
-- ============================================

-- Add presentation_id column (NULL for topics generation)
ALTER TABLE manus_tasks
ADD COLUMN IF NOT EXISTS presentation_id UUID DEFAULT NULL REFERENCES presentations(id) ON DELETE CASCADE;

-- Add webhook_data column
ALTER TABLE manus_tasks
ADD COLUMN IF NOT EXISTS webhook_data JSONB DEFAULT NULL;

-- Create index for presentation_id
CREATE INDEX IF NOT EXISTS idx_manus_tasks_presentation_id ON manus_tasks(presentation_id);

-- Add comments
COMMENT ON COLUMN manus_tasks.presentation_id IS 'Associated presentation ID (NULL for topics generation)';
COMMENT ON COLUMN manus_tasks.webhook_data IS 'Last webhook payload received from Manus API';
