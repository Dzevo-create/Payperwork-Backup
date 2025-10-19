-- ============================================
-- Manus Tasks Table (CLEAN VERSION)
-- Date: 2025-10-19
-- ============================================

-- Drop table if exists (clean slate)
DROP TABLE IF EXISTS manus_tasks CASCADE;

-- Drop function if exists
DROP FUNCTION IF EXISTS update_manus_tasks_updated_at() CASCADE;

-- Create manus_tasks table
CREATE TABLE manus_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  presentation_id UUID DEFAULT NULL,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  output JSONB DEFAULT NULL,
  error TEXT DEFAULT NULL,
  webhook_data JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NULL,

  -- Constraints
  CONSTRAINT manus_tasks_task_type_check CHECK (task_type IN ('generate_topics', 'generate_slides')),
  CONSTRAINT manus_tasks_status_check CHECK (status IN ('running', 'completed', 'failed'))
);

-- Add foreign key constraint (only if presentations table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'presentations') THEN
    ALTER TABLE manus_tasks
    ADD CONSTRAINT manus_tasks_presentation_id_fkey
    FOREIGN KEY (presentation_id)
    REFERENCES presentations(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX idx_manus_tasks_task_id ON manus_tasks(task_id);
CREATE INDEX idx_manus_tasks_user_id ON manus_tasks(user_id);
CREATE INDEX idx_manus_tasks_presentation_id ON manus_tasks(presentation_id);
CREATE INDEX idx_manus_tasks_status ON manus_tasks(status);
CREATE INDEX idx_manus_tasks_task_type ON manus_tasks(task_type);
CREATE INDEX idx_manus_tasks_created_at ON manus_tasks(created_at DESC);

-- Create function to update updated_at timestamp
CREATE FUNCTION update_manus_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_manus_tasks_updated_at
  BEFORE UPDATE ON manus_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_manus_tasks_updated_at();

-- Enable RLS
ALTER TABLE manus_tasks ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (development-friendly)
CREATE POLICY "manus_tasks_select_all" ON manus_tasks FOR SELECT USING (true);
CREATE POLICY "manus_tasks_insert_all" ON manus_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "manus_tasks_update_all" ON manus_tasks FOR UPDATE USING (true);
CREATE POLICY "manus_tasks_delete_all" ON manus_tasks FOR DELETE USING (true);

-- Add comments
COMMENT ON TABLE manus_tasks IS 'Stores Manus API tasks for topics and slides generation';
COMMENT ON COLUMN manus_tasks.task_id IS 'Unique task ID from Manus API';
COMMENT ON COLUMN manus_tasks.user_id IS 'User ID (TEXT format for development)';
COMMENT ON COLUMN manus_tasks.presentation_id IS 'Associated presentation ID (NULL for topics)';
COMMENT ON COLUMN manus_tasks.task_type IS 'Type: generate_topics or generate_slides';
COMMENT ON COLUMN manus_tasks.status IS 'Status: running, completed, or failed';
COMMENT ON COLUMN manus_tasks.metadata IS 'Task metadata (prompt, format, theme)';
COMMENT ON COLUMN manus_tasks.output IS 'Task output (topics array or slides data)';
COMMENT ON COLUMN manus_tasks.error IS 'Error message if failed';
COMMENT ON COLUMN manus_tasks.webhook_data IS 'Last webhook payload from Manus';
