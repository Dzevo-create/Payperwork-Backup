-- Sketch to Render Generations Table
-- Stores all renders, videos, and upscales from the sketch-to-render workflow

CREATE TABLE IF NOT EXISTS sketch_to_render (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Media
  url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Type and source
  type TEXT NOT NULL CHECK (type IN ('render', 'video', 'upscale')),
  source_type TEXT CHECK (source_type IN ('original', 'from_render', 'from_video')),
  parent_id UUID REFERENCES sketch_to_render(id) ON DELETE SET NULL,

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
CREATE INDEX IF NOT EXISTS idx_sketch_to_render_user_id ON sketch_to_render(user_id);
CREATE INDEX IF NOT EXISTS idx_sketch_to_render_type ON sketch_to_render(type);
CREATE INDEX IF NOT EXISTS idx_sketch_to_render_created_at ON sketch_to_render(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sketch_to_render_parent_id ON sketch_to_render(parent_id);

-- Enable Row Level Security
ALTER TABLE sketch_to_render ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own renders"
  ON sketch_to_render FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own renders"
  ON sketch_to_render FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own renders"
  ON sketch_to_render FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own renders"
  ON sketch_to_render FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sketch_to_render_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_sketch_to_render_updated_at_trigger
  BEFORE UPDATE ON sketch_to_render
  FOR EACH ROW
  EXECUTE FUNCTION update_sketch_to_render_updated_at();
