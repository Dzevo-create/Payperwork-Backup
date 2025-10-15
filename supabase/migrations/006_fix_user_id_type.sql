-- Fix user_id column type from UUID to TEXT
-- This allows us to use simple string IDs like "user_1234567890_abc123"

-- First, drop the table if it exists (since we're in development)
DROP TABLE IF EXISTS sketch_to_render CASCADE;

-- Recreate table with TEXT user_id (not UUID)
CREATE TABLE sketch_to_render (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- Changed from UUID to TEXT
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('render', 'video', 'upscale')),
  source_type TEXT CHECK (source_type IN ('original', 'from_render', 'from_video')),
  parent_id UUID REFERENCES sketch_to_render(id) ON DELETE SET NULL,
  prompt TEXT,
  model TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for performance
CREATE INDEX idx_sketch_to_render_user_id ON sketch_to_render(user_id);
CREATE INDEX idx_sketch_to_render_type ON sketch_to_render(type);
CREATE INDEX idx_sketch_to_render_created_at ON sketch_to_render(created_at DESC);
CREATE INDEX idx_sketch_to_render_parent_id ON sketch_to_render(parent_id);

-- Disable RLS for development (no authentication yet)
ALTER TABLE sketch_to_render DISABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON sketch_to_render TO postgres;
GRANT ALL ON sketch_to_render TO anon;
GRANT ALL ON sketch_to_render TO authenticated;
GRANT ALL ON sketch_to_render TO service_role;
