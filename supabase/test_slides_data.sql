-- ============================================
-- Test Data for Slides Feature
-- Run this in Supabase SQL Editor to create sample data
-- ============================================

-- Important: Set your user_id first
-- Replace 'YOUR_USER_ID_HERE' with your actual user_id
-- You can get your user_id from: SELECT auth.uid();

-- ============================================
-- Test 1: Create a Sample Presentation
-- ============================================

-- First, let's create a presentation
INSERT INTO presentations (user_id, title, prompt, format, theme, status)
VALUES (
  'user_1760476311866_hn82iiooq', -- Replace with your user_id
  'Remote-Arbeit: Die Zukunft der Arbeit',
  'Erstelle eine Präsentation über die Vorteile von Remote-Arbeit',
  '16:9',
  'blue',
  'ready'
)
RETURNING id, title, format, theme, status;

-- ============================================
-- Test 2: Create Slides for the Presentation
-- ============================================

-- Get the presentation_id from the previous query
-- Replace '<PRESENTATION_ID>' with the actual id

-- Slide 1: Title Slide
INSERT INTO slides (presentation_id, order_index, title, content, layout, background_color)
VALUES (
  '<PRESENTATION_ID>', -- Replace with actual presentation_id
  0,
  'Remote-Arbeit: Die Zukunft der Arbeit',
  '# Remote-Arbeit: Die Zukunft der Arbeit\n\n## Flexibilität, Produktivität, Zufriedenheit\n\n**Präsentiert von Payperwork**',
  'title_slide',
  '#3b82f6'
);

-- Slide 2: Content Slide - Vorteile
INSERT INTO slides (presentation_id, order_index, title, content, layout)
VALUES (
  '<PRESENTATION_ID>',
  1,
  'Vorteile von Remote-Arbeit',
  '## Vorteile von Remote-Arbeit\n\n- **Flexibilität**: Arbeiten von überall\n- **Work-Life Balance**: Mehr Zeit für Familie\n- **Kostenersparnis**: Keine Pendelkosten\n- **Produktivität**: Weniger Ablenkungen\n- **Zufriedenheit**: Höhere Mitarbeiterzufriedenheit',
  'content'
);

-- Slide 3: Two Column Slide - Statistiken
INSERT INTO slides (presentation_id, order_index, title, content, layout)
VALUES (
  '<PRESENTATION_ID>',
  2,
  'Remote-Arbeit in Zahlen',
  '## Remote-Arbeit in Zahlen\n\n### Deutschland\n- 25% arbeiten remote\n- 40% möchten mehr remote arbeiten\n- 15% sparen >2h täglich\n\n### Weltweit\n- 16% aller Unternehmen sind fully remote\n- 44% erlauben kein remote work\n- 40% hybrid model',
  'two_column'
);

-- Slide 4: Quote Slide
INSERT INTO slides (presentation_id, order_index, title, content, layout, background_color)
VALUES (
  '<PRESENTATION_ID>',
  3,
  'Erfolgsgeschichte',
  '> "Remote-Arbeit hat unser Team produktiver und glücklicher gemacht. Wir würden nie zurückgehen."\n\n**— Tech Startup CEO, 2024**',
  'quote',
  '#f3f4f6'
);

-- Slide 5: Final Slide
INSERT INTO slides (presentation_id, order_index, title, content, layout, background_color)
VALUES (
  '<PRESENTATION_ID>',
  4,
  'Vielen Dank!',
  '# Vielen Dank!\n\n## Fragen?\n\n**Kontakt:** info@payperwork.com\n**Website:** www.payperwork.com',
  'title_slide',
  '#3b82f6'
);

-- ============================================
-- Test 3: Create a Manus Task
-- ============================================

INSERT INTO manus_tasks (task_id, presentation_id, status, webhook_data)
VALUES (
  'task_test_123456',
  '<PRESENTATION_ID>', -- Replace with actual presentation_id
  'completed',
  '{
    "event_type": "task_stopped",
    "stop_reason": "finish",
    "task_id": "task_test_123456",
    "created_at": "2025-10-19T10:00:00Z",
    "attachments": []
  }'::jsonb
);

-- ============================================
-- Test 4: Query the Data
-- ============================================

-- View all presentations
SELECT
  id,
  title,
  format,
  theme,
  status,
  created_at
FROM presentations
ORDER BY created_at DESC;

-- View all slides for the presentation (ordered)
SELECT
  order_index,
  title,
  layout,
  LEFT(content, 50) as content_preview
FROM slides
WHERE presentation_id = '<PRESENTATION_ID>' -- Replace with actual presentation_id
ORDER BY order_index;

-- View the manus task
SELECT
  task_id,
  status,
  webhook_data->>'event_type' as event_type,
  created_at
FROM manus_tasks
WHERE presentation_id = '<PRESENTATION_ID>'; -- Replace with actual presentation_id

-- ============================================
-- Test 5: Test the Auto-Update Trigger
-- ============================================

-- Update the first slide's title
UPDATE slides
SET title = 'Remote-Arbeit: UPDATED TITLE'
WHERE presentation_id = '<PRESENTATION_ID>' -- Replace with actual presentation_id
AND order_index = 0;

-- Check if the presentation title was auto-updated
SELECT title FROM presentations WHERE id = '<PRESENTATION_ID>'; -- Replace with actual presentation_id
-- Expected: 'Remote-Arbeit: UPDATED TITLE'

-- ============================================
-- Test 6: Test RLS Policies
-- ============================================

-- This should return your presentations (with your user_id)
SELECT COUNT(*) as my_presentations FROM presentations;

-- ============================================
-- Cleanup (Optional)
-- ============================================

-- Uncomment to delete test data:
/*
DELETE FROM presentations WHERE id = '<PRESENTATION_ID>';
-- This will cascade delete slides and manus_tasks
*/
