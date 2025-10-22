-- Style-Transfer Generations Table (SAFE VERSION)
-- Stores all renders, videos, and upscales from the style-transfer workflow
-- This version uses IF NOT EXISTS and DROP IF EXISTS to be idempotent

-- Create table (safe, won't fail if exists)
CREATE TABLE IF NOT EXISTS style_transfer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,

  -- Media
  url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Type and source
  type TEXT NOT NULL CHECK (type IN ('render', 'video', 'upscale')),
  source_type TEXT CHECK (source_type IN ('original', 'from_render', 'from_video')),
  parent_id UUID REFERENCES style_transfer(id) ON DELETE SET NULL,

  -- Generation details
  prompt TEXT,
  model TEXT NOT NULL,

  -- Settings used
  settings JSONB DEFAULT '{}',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Auto-generated name
  name TEXT NOT NULL,

  -- Source image URL for lightbox display
  source_image TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for faster queries (safe, won't fail if exists)
CREATE INDEX IF NOT EXISTS idx_style_transfer_user_id ON style_transfer(user_id);
CREATE INDEX IF NOT EXISTS idx_style_transfer_type ON style_transfer(type);
CREATE INDEX IF NOT EXISTS idx_style_transfer_created_at ON style_transfer(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_style_transfer_parent_id ON style_transfer(parent_id);

-- Enable Row Level Security
ALTER TABLE style_transfer ENABLE ROW LEVEL SECURITY;

-- Drop old policies first (safe, won't fail if not exists)
DROP POLICY IF EXISTS "Users can view their own style-transfer renders" ON style_transfer;
DROP POLICY IF EXISTS "Users can insert their own style-transfer renders" ON style_transfer;
DROP POLICY IF EXISTS "Users can update their own style-transfer renders" ON style_transfer;
DROP POLICY IF EXISTS "Users can delete their own style-transfer renders" ON style_transfer;

-- Create policies (DEVELOPMENT MODE - permissive)
CREATE POLICY "Development: Allow all reads on style_transfer"
  ON style_transfer FOR SELECT
  USING (true);

CREATE POLICY "Development: Allow all inserts on style_transfer"
  ON style_transfer FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Development: Allow all updates on style_transfer"
  ON style_transfer FOR UPDATE
  USING (true);

CREATE POLICY "Development: Allow all deletes on style_transfer"
  ON style_transfer FOR DELETE
  USING (true);

-- Function to update updated_at timestamp (safe, will replace if exists)
CREATE OR REPLACE FUNCTION update_style_transfer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger first (safe, won't fail if not exists)
DROP TRIGGER IF EXISTS update_style_transfer_updated_at_trigger ON style_transfer;

-- Create trigger
CREATE TRIGGER update_style_transfer_updated_at_trigger
  BEFORE UPDATE ON style_transfer
  FOR EACH ROW
  EXECUTE FUNCTION update_style_transfer_updated_at();

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ style_transfer table ready';
  RAISE NOTICE '✅ RLS enabled with 4 development policies';
  RAISE NOTICE '✅ Trigger for updated_at created';
END $$;
