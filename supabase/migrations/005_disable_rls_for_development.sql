-- TEMPORARY: Disable RLS for development
-- This allows the service role to insert/update/delete without auth context
-- In production, you should enable RLS and use proper authentication

-- Disable RLS on sketch_to_render table
ALTER TABLE sketch_to_render DISABLE ROW LEVEL SECURITY;

-- Note: To re-enable RLS in production, run:
-- ALTER TABLE sketch_to_render ENABLE ROW LEVEL SECURITY;
