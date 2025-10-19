-- ============================================
-- Verification Script for Slides Migration
-- Run this in Supabase SQL Editor to verify setup
-- ============================================

-- Check 1: Verify Tables Exist
SELECT
  'Tables Check' as test_name,
  COUNT(*) as result,
  '3 expected' as expected
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('presentations', 'slides', 'manus_tasks');

-- Check 2: Verify Presentations Table Columns
SELECT
  'Presentations Columns' as test_name,
  COUNT(*) as result,
  '10 expected (id, user_id, task_id, title, prompt, format, theme, status, created_at, updated_at)' as expected
FROM information_schema.columns
WHERE table_name = 'presentations';

-- Check 3: Verify Slides Table Columns
SELECT
  'Slides Columns' as test_name,
  COUNT(*) as result,
  '11 expected (id, presentation_id, order_index, title, content, layout, background_color, background_image, speaker_notes, created_at, updated_at)' as expected
FROM information_schema.columns
WHERE table_name = 'slides';

-- Check 4: Verify Manus Tasks Table Columns
SELECT
  'Manus Tasks Columns' as test_name,
  COUNT(*) as result,
  '6 expected (id, task_id, presentation_id, status, webhook_data, created_at, updated_at)' as expected
FROM information_schema.columns
WHERE table_name = 'manus_tasks';

-- Check 5: Verify Indexes
SELECT
  'Indexes Check' as test_name,
  COUNT(*) as result,
  '11 expected indexes' as expected
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('presentations', 'slides', 'manus_tasks');

-- Check 6: Verify RLS Policies
SELECT
  'RLS Policies Check' as test_name,
  COUNT(*) as result,
  '9 expected policies' as expected
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('presentations', 'slides', 'manus_tasks');

-- Check 7: Verify Triggers
SELECT
  'Triggers Check' as test_name,
  COUNT(*) as result,
  '4 expected triggers' as expected
FROM information_schema.triggers
WHERE event_object_table IN ('presentations', 'slides', 'manus_tasks');

-- Check 8: List All Tables (for visual confirmation)
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('presentations', 'slides', 'manus_tasks')
ORDER BY table_name;

-- Check 9: List All Indexes
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('presentations', 'slides', 'manus_tasks')
ORDER BY tablename, indexname;

-- Check 10: List All RLS Policies
SELECT
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('presentations', 'slides', 'manus_tasks')
ORDER BY tablename, policyname;

-- Check 11: List All Triggers
SELECT
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event
FROM information_schema.triggers
WHERE event_object_table IN ('presentations', 'slides', 'manus_tasks')
ORDER BY event_object_table, trigger_name;

-- ============================================
-- Summary
-- ============================================
SELECT
  'VERIFICATION SUMMARY' as status,
  'If all counts match expected values above, migration was successful!' as message;
