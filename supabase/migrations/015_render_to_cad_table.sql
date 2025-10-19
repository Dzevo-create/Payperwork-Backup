-- Render-to-CAD Generations Table
-- Stores all CAD drawings and upscales from the render-to-cad workflow

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

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_render_to_cad_user_id ON render_to_cad(user_id);
CREATE INDEX IF NOT EXISTS idx_render_to_cad_type ON render_to_cad(type);
CREATE INDEX IF NOT EXISTS idx_render_to_cad_created_at ON render_to_cad(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_render_to_cad_parent_id ON render_to_cad(parent_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_render_to_cad_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_render_to_cad_updated_at_trigger
  BEFORE UPDATE ON render_to_cad
  FOR EACH ROW
  EXECUTE FUNCTION update_render_to_cad_updated_at();
