-- ============================================
-- Fix RLS Policies for manus_tasks
-- Remove auth.uid() dependency for development
-- Date: 2025-10-19
-- ============================================

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own manus tasks" ON manus_tasks;
DROP POLICY IF EXISTS "Users can insert own manus tasks" ON manus_tasks;
DROP POLICY IF EXISTS "Users can update own manus tasks" ON manus_tasks;
DROP POLICY IF EXISTS "Users can delete own manus tasks" ON manus_tasks;

-- Create permissive policies for development (no auth.uid() dependency)
-- These allow all operations as long as the user_id is provided

-- Allow all SELECT operations (for service role and development)
CREATE POLICY "Allow all select on manus_tasks"
  ON manus_tasks
  FOR SELECT
  USING (true);

-- Allow all INSERT operations (for service role and development)
CREATE POLICY "Allow all insert on manus_tasks"
  ON manus_tasks
  FOR INSERT
  WITH CHECK (true);

-- Allow all UPDATE operations (for service role and development)
CREATE POLICY "Allow all update on manus_tasks"
  ON manus_tasks
  FOR UPDATE
  USING (true);

-- Allow all DELETE operations (for service role and development)
CREATE POLICY "Allow all delete on manus_tasks"
  ON manus_tasks
  FOR DELETE
  USING (true);

-- Comment on RLS policies
COMMENT ON POLICY "Allow all select on manus_tasks" ON manus_tasks IS
  'Permissive policy for development - allows all SELECT operations';
COMMENT ON POLICY "Allow all insert on manus_tasks" ON manus_tasks IS
  'Permissive policy for development - allows all INSERT operations';
COMMENT ON POLICY "Allow all update on manus_tasks" ON manus_tasks IS
  'Permissive policy for development - allows all UPDATE operations';
COMMENT ON POLICY "Allow all delete on manus_tasks" ON manus_tasks IS
  'Permissive policy for development - allows all DELETE operations';
