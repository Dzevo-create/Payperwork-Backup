-- Style-Transfer Generations Table
-- Stores all renders, videos, and upscales from the style-transfer workflow

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

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_style_transfer_user_id ON style_transfer(user_id);
CREATE INDEX IF NOT EXISTS idx_style_transfer_type ON style_transfer(type);
CREATE INDEX IF NOT EXISTS idx_style_transfer_created_at ON style_transfer(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_style_transfer_parent_id ON style_transfer(parent_id);

-- Enable Row Level Security
ALTER TABLE style_transfer ENABLE ROW LEVEL SECURITY;

-- Policies (using TEXT user_id, permissive for development)
CREATE POLICY "Users can view their own style-transfer renders"
  ON style_transfer FOR SELECT
  USING (true); -- Allow all reads for now (you can restrict by user_id later)

CREATE POLICY "Users can insert their own style-transfer renders"
  ON style_transfer FOR INSERT
  WITH CHECK (true); -- Allow all inserts for now

CREATE POLICY "Users can update their own style-transfer renders"
  ON style_transfer FOR UPDATE
  USING (true); -- Allow all updates for now

CREATE POLICY "Users can delete their own style-transfer renders"
  ON style_transfer FOR DELETE
  USING (true); -- Allow all deletes for now

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_style_transfer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_style_transfer_updated_at_trigger
  BEFORE UPDATE ON style_transfer
  FOR EACH ROW
  EXECUTE FUNCTION update_style_transfer_updated_at();
