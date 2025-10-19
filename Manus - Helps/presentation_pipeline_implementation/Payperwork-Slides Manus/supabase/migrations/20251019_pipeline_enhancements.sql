-- ============================================
-- Presentation Pipeline Enhancements
-- Version: 1.0
-- Date: 2025-10-19
-- Author: Payperwork Team
-- Description: Add support for Research, Topics, and Pipeline metadata
-- ============================================

-- ============================================
-- 1. Add new columns to presentations table
-- ============================================

-- Add topics column (JSONB array of TopicWithResearch)
ALTER TABLE presentations
ADD COLUMN IF NOT EXISTS topics JSONB;

-- Add research_data column (JSONB with research results)
ALTER TABLE presentations
ADD COLUMN IF NOT EXISTS research_data JSONB;

-- Add metadata column (JSONB with pipeline metadata)
ALTER TABLE presentations
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add slide_count column (for quick access)
ALTER TABLE presentations
ADD COLUMN IF NOT EXISTS slide_count INTEGER DEFAULT 0;

-- Update status enum to include new states
ALTER TABLE presentations
DROP CONSTRAINT IF EXISTS presentations_status_check;

ALTER TABLE presentations
ADD CONSTRAINT presentations_status_check
CHECK (status IN (
  'generating',
  'processing',
  'planning',
  'topics_generated',
  'ready',
  'error'
));

-- ============================================
-- 2. Add comments for new columns
-- ============================================

COMMENT ON COLUMN presentations.topics IS 'Array of TopicWithResearch objects generated during pipeline';
COMMENT ON COLUMN presentations.research_data IS 'Research results including summary, keyFindings, and sources';
COMMENT ON COLUMN presentations.metadata IS 'Pipeline metadata including execution times and quality score';
COMMENT ON COLUMN presentations.slide_count IS 'Total number of slides in the presentation';

-- ============================================
-- 3. Create indexes for new columns
-- ============================================

-- Index for slide_count (for sorting/filtering)
CREATE INDEX IF NOT EXISTS idx_presentations_slide_count ON presentations(slide_count);

-- GIN index for topics JSONB (for querying topics)
CREATE INDEX IF NOT EXISTS idx_presentations_topics_gin ON presentations USING GIN (topics);

-- GIN index for research_data JSONB (for querying research)
CREATE INDEX IF NOT EXISTS idx_presentations_research_data_gin ON presentations USING GIN (research_data);

-- ============================================
-- 4. Update trigger for slide_count
-- ============================================

-- Function: Auto-update slide_count when slides are added/removed
CREATE OR REPLACE FUNCTION update_presentation_slide_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE presentations
    SET 
      slide_count = slide_count + 1,
      updated_at = NOW()
    WHERE id = NEW.presentation_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE presentations
    SET 
      slide_count = GREATEST(0, slide_count - 1),
      updated_at = NOW()
    WHERE id = OLD.presentation_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update slide_count
DROP TRIGGER IF EXISTS trigger_update_slide_count ON slides;
CREATE TRIGGER trigger_update_slide_count
AFTER INSERT OR DELETE ON slides
FOR EACH ROW
EXECUTE FUNCTION update_presentation_slide_count();

-- ============================================
-- 5. Initialize slide_count for existing presentations
-- ============================================

UPDATE presentations
SET slide_count = (
  SELECT COUNT(*)
  FROM slides
  WHERE slides.presentation_id = presentations.id
)
WHERE slide_count = 0 OR slide_count IS NULL;

-- ============================================
-- 6. Sample data structure documentation
-- ============================================

/*
Example topics structure:
[
  {
    "order": 1,
    "title": "Einleitung",
    "description": "Kurze Übersicht über das Thema",
    "keyPoints": ["Punkt 1", "Punkt 2"],
    "relevantSources": ["https://example.com/source1"]
  },
  ...
]

Example research_data structure:
{
  "summary": "Executive summary of research...",
  "keyFindings": [
    "Finding 1",
    "Finding 2"
  ],
  "sources": [
    {
      "title": "Source Title",
      "url": "https://example.com",
      "snippet": "Relevant snippet..."
    }
  ]
}

Example metadata structure:
{
  "totalTime": 45000,
  "phaseTimes": {
    "research": 15000,
    "topicGeneration": 5000,
    "contentGeneration": 20000,
    "preProduction": 5000
  },
  "qualityScore": 85
}
*/

