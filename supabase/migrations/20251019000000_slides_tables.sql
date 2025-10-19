-- ============================================
-- Slides Feature - Database Schema
-- Version: 1.0
-- Date: 2025-10-19
-- Author: Payperwork Team
-- ============================================

-- Enable UUID extension (falls nicht bereits aktiviert)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table 1: presentations
-- ============================================

CREATE TABLE IF NOT EXISTS presentations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  user_id TEXT NOT NULL,

  -- Manus Integration
  task_id TEXT,

  -- Presentation Metadata
  title TEXT NOT NULL DEFAULT 'Untitled Presentation',
  prompt TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('16:9', '4:3', 'A4')),
  theme TEXT NOT NULL CHECK (theme IN ('default', 'red', 'rose', 'orange', 'green', 'blue', 'yellow', 'violet')),
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'error')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for presentations
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_presentations_task_id ON presentations(task_id);
CREATE INDEX IF NOT EXISTS idx_presentations_status ON presentations(status);
CREATE INDEX IF NOT EXISTS idx_presentations_created_at ON presentations(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE presentations IS 'Stores presentation metadata and settings';
COMMENT ON COLUMN presentations.format IS 'Aspect ratio: 16:9, 4:3, or A4';
COMMENT ON COLUMN presentations.theme IS 'Shadcn UI theme: default, red, rose, orange, green, blue, yellow, violet';
COMMENT ON COLUMN presentations.status IS 'Generation status: generating, ready, error';

-- ============================================
-- Table 2: slides
-- ============================================

CREATE TABLE IF NOT EXISTS slides (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE NOT NULL,

  -- Slide Order
  order_index INTEGER NOT NULL,

  -- Slide Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  layout TEXT NOT NULL DEFAULT 'content' CHECK (layout IN ('title_slide', 'content', 'two_column', 'image', 'quote')),

  -- Styling
  background_color TEXT,
  background_image TEXT,

  -- Speaker Notes
  speaker_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: One slide per order_index per presentation
  UNIQUE(presentation_id, order_index)
);

-- Indexes for slides
CREATE INDEX IF NOT EXISTS idx_slides_presentation_id ON slides(presentation_id);
CREATE INDEX IF NOT EXISTS idx_slides_order ON slides(presentation_id, order_index);

-- Comments for documentation
COMMENT ON TABLE slides IS 'Stores individual slides of a presentation';
COMMENT ON COLUMN slides.order_index IS 'Order of slides (0-indexed)';
COMMENT ON COLUMN slides.content IS 'Slide content in Markdown format';
COMMENT ON COLUMN slides.layout IS 'Slide layout: title_slide, content, two_column, image, quote';

-- ============================================
-- Table 3: manus_tasks
-- ============================================

CREATE TABLE IF NOT EXISTS manus_tasks (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Manus Task ID (unique)
  task_id TEXT UNIQUE NOT NULL,

  -- Foreign Keys
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE NOT NULL,

  -- Task Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),

  -- Webhook Data
  webhook_data JSONB,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for manus_tasks
CREATE INDEX IF NOT EXISTS idx_manus_tasks_task_id ON manus_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_manus_tasks_presentation_id ON manus_tasks(presentation_id);
CREATE INDEX IF NOT EXISTS idx_manus_tasks_status ON manus_tasks(status);

-- Comments for documentation
COMMENT ON TABLE manus_tasks IS 'Tracks Manus API task status and webhook data';
COMMENT ON COLUMN manus_tasks.task_id IS 'Manus API task ID';
COMMENT ON COLUMN manus_tasks.webhook_data IS 'Full webhook payload from Manus API';

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE manus_tasks ENABLE ROW LEVEL SECURITY;

-- Presentations: Users can only see their own presentations
CREATE POLICY "Users can view their own presentations"
  ON presentations FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can create presentations"
  ON presentations FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update their own presentations"
  ON presentations FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete their own presentations"
  ON presentations FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- Slides: Users can only see slides of their presentations
CREATE POLICY "Users can view slides of their presentations"
  ON slides FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can create slides for their presentations"
  ON slides FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can update slides of their presentations"
  ON slides FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can delete slides of their presentations"
  ON slides FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = current_setting('app.current_user_id', true)
    )
  );

-- Manus Tasks: Users can only see tasks for their presentations
CREATE POLICY "Users can view tasks for their presentations"
  ON manus_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = manus_tasks.presentation_id
      AND presentations.user_id = current_setting('app.current_user_id', true)
    )
  );

-- ============================================
-- Functions & Triggers
-- ============================================

-- Function: Auto-update presentation title from first slide
CREATE OR REPLACE FUNCTION update_presentation_title()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update title if it's the first slide (order_index = 0)
  IF NEW.order_index = 0 THEN
    UPDATE presentations
    SET title = NEW.title, updated_at = NOW()
    WHERE id = NEW.presentation_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update presentation title when first slide is created/updated
DROP TRIGGER IF EXISTS trigger_update_presentation_title ON slides;
CREATE TRIGGER trigger_update_presentation_title
AFTER INSERT OR UPDATE ON slides
FOR EACH ROW
EXECUTE FUNCTION update_presentation_title();

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers: Auto-update updated_at on all tables
DROP TRIGGER IF EXISTS update_presentations_updated_at ON presentations;
CREATE TRIGGER update_presentations_updated_at
BEFORE UPDATE ON presentations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_slides_updated_at ON slides;
CREATE TRIGGER update_slides_updated_at
BEFORE UPDATE ON slides
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_manus_tasks_updated_at ON manus_tasks;
CREATE TRIGGER update_manus_tasks_updated_at
BEFORE UPDATE ON manus_tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
