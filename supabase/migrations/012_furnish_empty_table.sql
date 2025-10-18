-- Furnish-Empty Generations Table
-- Stores all renders, videos, and upscales from the furnish-empty workflow

CREATE TABLE IF NOT EXISTS furnish_empty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,

  -- Media
  url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Type and source
  type TEXT NOT NULL CHECK (type IN ('render', 'video', 'upscale')),
  source_type TEXT CHECK (source_type IN ('original', 'from_render', 'from_video')),
  parent_id UUID REFERENCES furnish_empty(id) ON DELETE SET NULL,

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
CREATE INDEX IF NOT EXISTS idx_furnish_empty_user_id ON furnish_empty(user_id);
CREATE INDEX IF NOT EXISTS idx_furnish_empty_type ON furnish_empty(type);
CREATE INDEX IF NOT EXISTS idx_furnish_empty_created_at ON furnish_empty(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_furnish_empty_parent_id ON furnish_empty(parent_id);

-- Enable Row Level Security
ALTER TABLE furnish_empty ENABLE ROW LEVEL SECURITY;

-- Policies (using TEXT user_id, permissive for development)
CREATE POLICY "Users can view their own furnish-empty renders"
  ON furnish_empty FOR SELECT
  USING (true); -- Allow all reads for now (you can restrict by user_id later)

CREATE POLICY "Users can insert their own furnish-empty renders"
  ON furnish_empty FOR INSERT
  WITH CHECK (true); -- Allow all inserts for now

CREATE POLICY "Users can update their own furnish-empty renders"
  ON furnish_empty FOR UPDATE
  USING (true); -- Allow all updates for now

CREATE POLICY "Users can delete their own furnish-empty renders"
  ON furnish_empty FOR DELETE
  USING (true); -- Allow all deletes for now

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_furnish_empty_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_furnish_empty_updated_at_trigger
  BEFORE UPDATE ON furnish_empty
  FOR EACH ROW
  EXECUTE FUNCTION update_furnish_empty_updated_at();
