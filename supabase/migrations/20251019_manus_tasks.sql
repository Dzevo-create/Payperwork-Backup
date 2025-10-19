-- ============================================
-- Manus Tasks Table
-- Stores Manus API tasks for topics and slides generation
-- Date: 2025-10-19
-- ============================================

-- Create manus_tasks table
CREATE TABLE IF NOT EXISTS manus_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  presentation_id UUID DEFAULT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('generate_topics', 'generate_slides')),
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  output JSONB DEFAULT NULL,
  error TEXT DEFAULT NULL,
  webhook_data JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_manus_tasks_task_id ON manus_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_manus_tasks_user_id ON manus_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_manus_tasks_presentation_id ON manus_tasks(presentation_id);
CREATE INDEX IF NOT EXISTS idx_manus_tasks_status ON manus_tasks(status);
CREATE INDEX IF NOT EXISTS idx_manus_tasks_task_type ON manus_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_manus_tasks_created_at ON manus_tasks(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_manus_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_manus_tasks_updated_at
  BEFORE UPDATE ON manus_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_manus_tasks_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE manus_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own tasks
CREATE POLICY "Users can view own manus tasks"
  ON manus_tasks
  FOR SELECT
  USING (user_id = auth.uid()::text);

-- Create RLS policy: Users can insert their own tasks
CREATE POLICY "Users can insert own manus tasks"
  ON manus_tasks
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

-- Create RLS policy: Users can update their own tasks
CREATE POLICY "Users can update own manus tasks"
  ON manus_tasks
  FOR UPDATE
  USING (user_id = auth.uid()::text);

-- Create RLS policy: Users can delete their own tasks
CREATE POLICY "Users can delete own manus tasks"
  ON manus_tasks
  FOR DELETE
  USING (user_id = auth.uid()::text);

-- Comment on table
COMMENT ON TABLE manus_tasks IS 'Stores Manus API tasks for topics and slides generation with real-time status updates';

-- Comments on columns
COMMENT ON COLUMN manus_tasks.task_id IS 'Unique task ID from Manus API';
COMMENT ON COLUMN manus_tasks.user_id IS 'User ID (TEXT format from auth system)';
COMMENT ON COLUMN manus_tasks.presentation_id IS 'Associated presentation ID (NULL for topics generation)';
COMMENT ON COLUMN manus_tasks.task_type IS 'Type of task: generate_topics or generate_slides';
COMMENT ON COLUMN manus_tasks.status IS 'Current status: running, completed, or failed';
COMMENT ON COLUMN manus_tasks.metadata IS 'Task metadata (prompt, format, theme, etc.)';
COMMENT ON COLUMN manus_tasks.output IS 'Task output (topics array or slides data)';
COMMENT ON COLUMN manus_tasks.error IS 'Error message if task failed';
COMMENT ON COLUMN manus_tasks.webhook_data IS 'Last webhook payload received from Manus API';
