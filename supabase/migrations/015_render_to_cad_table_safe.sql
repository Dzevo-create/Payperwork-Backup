-- Render-to-CAD Generations Table (SAFE VERSION)
-- Stores all CAD drawings and upscales from the render-to-cad workflow
-- This version uses IF NOT EXISTS and DROP IF EXISTS to be idempotent

-- Create table (safe, won't fail if exists)
CREATE TABLE IF NOT EXISTS render_to_cad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,

  -- Media
  url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Type and source
  type TEXT NOT NULL CHECK (type IN ('render', 'video', 'upscale')),
  source_type TEXT CHECK (source_type IN ('original', 'from_render', 'from_video')),
  parent_id UUID REFERENCES render_to_cad(id) ON DELETE SET NULL,

  -- Generation details
  prompt TEXT,
  model TEXT NOT NULL,

  -- Settings used
  settings JSONB DEFAULT '{}',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Auto-generated name
  name TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for faster queries (safe, won't fail if exists)
CREATE INDEX IF NOT EXISTS idx_render_to_cad_user_id ON render_to_cad(user_id);
CREATE INDEX IF NOT EXISTS idx_render_to_cad_type ON render_to_cad(type);
CREATE INDEX IF NOT EXISTS idx_render_to_cad_created_at ON render_to_cad(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_render_to_cad_parent_id ON render_to_cad(parent_id);

-- Enable Row Level Security
ALTER TABLE render_to_cad ENABLE ROW LEVEL SECURITY;

-- Drop old policies first (safe, won't fail if not exists)
DROP POLICY IF EXISTS "Users can view their own render-to-cad renders" ON render_to_cad;
DROP POLICY IF EXISTS "Users can insert their own render-to-cad renders" ON render_to_cad;
DROP POLICY IF EXISTS "Users can update their own render-to-cad renders" ON render_to_cad;
DROP POLICY IF EXISTS "Users can delete their own render-to-cad renders" ON render_to_cad;
DROP POLICY IF EXISTS "Development: Allow all reads on render_to_cad" ON render_to_cad;
DROP POLICY IF EXISTS "Development: Allow all inserts on render_to_cad" ON render_to_cad;
DROP POLICY IF EXISTS "Development: Allow all updates on render_to_cad" ON render_to_cad;
DROP POLICY IF EXISTS "Development: Allow all deletes on render_to_cad" ON render_to_cad;

-- Create policies (DEVELOPMENT MODE - permissive)
CREATE POLICY "Development: Allow all reads on render_to_cad"
  ON render_to_cad FOR SELECT
  USING (true);

CREATE POLICY "Development: Allow all inserts on render_to_cad"
  ON render_to_cad FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Development: Allow all updates on render_to_cad"
  ON render_to_cad FOR UPDATE
  USING (true);

CREATE POLICY "Development: Allow all deletes on render_to_cad"
  ON render_to_cad FOR DELETE
  USING (true);

-- Function to update updated_at timestamp (safe, will replace if exists)
CREATE OR REPLACE FUNCTION update_render_to_cad_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger first (safe, won't fail if not exists)
DROP TRIGGER IF EXISTS update_render_to_cad_updated_at_trigger ON render_to_cad;

-- Create trigger
CREATE TRIGGER update_render_to_cad_updated_at_trigger
  BEFORE UPDATE ON render_to_cad
  FOR EACH ROW
  EXECUTE FUNCTION update_render_to_cad_updated_at();

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ render_to_cad table ready';
  RAISE NOTICE '✅ RLS enabled with 4 development policies';
  RAISE NOTICE '✅ Trigger for updated_at created';
END $$;
