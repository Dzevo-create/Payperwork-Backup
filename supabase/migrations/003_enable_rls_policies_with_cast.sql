-- =====================================================
-- Payperwork RLS Policies Setup (WITH TYPE CAST FIX)
-- =====================================================
-- This script enables Row Level Security (RLS) on all tables
-- and creates policies to ensure users can only access their own data.
--
-- IMPORTANT: Run this script in the Supabase SQL Editor
-- Navigation: Supabase Dashboard > SQL Editor > New Query > Paste & Run
--
-- Date: 2025-01-22
-- FIXED: Added type casting to handle uuid <-> text conversion
-- =====================================================

-- =====================================================
-- STEP 1: Enable RLS on all tables
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: conversations Table Policies
-- =====================================================

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can only insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can only update their own conversations
CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Users can only delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON conversations
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- =====================================================
-- STEP 3: messages Table Policies
-- =====================================================

-- Users can only see messages from their own conversations
CREATE POLICY "Users can view own messages"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()::text
    )
  );

-- Users can only insert messages to their own conversations
CREATE POLICY "Users can insert own messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()::text
    )
  );

-- Users can only delete messages from their own conversations
CREATE POLICY "Users can delete own messages"
  ON messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()::text
    )
  );

-- =====================================================
-- STEP 4: library_items Table Policies
-- =====================================================

-- Users can only see their own library items
CREATE POLICY "Users can view own library items"
  ON library_items
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can only insert their own library items
CREATE POLICY "Users can insert own library items"
  ON library_items
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can only update their own library items
CREATE POLICY "Users can update own library items"
  ON library_items
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Users can only delete their own library items
CREATE POLICY "Users can delete own library items"
  ON library_items
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- =====================================================
-- STEP 5: presentations Table Policies
-- =====================================================

-- Users can only see their own presentations
CREATE POLICY "Users can view own presentations"
  ON presentations
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can only insert their own presentations
CREATE POLICY "Users can insert own presentations"
  ON presentations
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can only update their own presentations
CREATE POLICY "Users can update own presentations"
  ON presentations
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Users can only delete their own presentations
CREATE POLICY "Users can delete own presentations"
  ON presentations
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- =====================================================
-- STEP 6: slides Table Policies
-- =====================================================

-- Users can only see slides from their own presentations
CREATE POLICY "Users can view own slides"
  ON slides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()::text
    )
  );

-- Users can only insert slides to their own presentations
CREATE POLICY "Users can insert own slides"
  ON slides
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()::text
    )
  );

-- Users can only update slides from their own presentations
CREATE POLICY "Users can update own slides"
  ON slides
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()::text
    )
  );

-- Users can only delete slides from their own presentations
CREATE POLICY "Users can delete own slides"
  ON slides
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = slides.presentation_id
      AND presentations.user_id = auth.uid()::text
    )
  );

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify RLS is enabled and policies exist:

-- Check if RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages', 'library_items', 'presentations', 'slides')
ORDER BY tablename;

-- List all policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- If this script runs without errors, RLS is now enabled!
--
-- Expected results:
-- - 5 tables with RLS enabled
-- - 4 policies per table (view, insert, update, delete)
-- - Total: 20 policies
--
-- Next steps:
-- 1. Test with two different users
-- 2. Verify users can only see their own data
-- 3. Update your API routes to use auth.uid() instead of localStorage
-- =====================================================
