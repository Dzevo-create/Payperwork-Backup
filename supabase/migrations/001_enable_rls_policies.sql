-- =====================================================
-- Payperwork RLS Policies Setup
-- =====================================================
-- This script enables Row Level Security (RLS) on all tables
-- and creates policies to ensure users can only access their own data.
--
-- IMPORTANT: Run this script in the Supabase SQL Editor
-- Navigation: Supabase Dashboard > SQL Editor > New Query > Paste & Run
--
-- Date: 2025-01-22
-- =====================================================

-- =====================================================
-- STEP 1: Enable RLS on all tables
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_slides ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: conversations Table Policies
-- =====================================================

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own conversations
CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON conversations
  FOR DELETE
  USING (auth.uid() = user_id);

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
      AND conversations.user_id = auth.uid()
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
      AND conversations.user_id = auth.uid()
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
      AND conversations.user_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 4: library_items Table Policies
-- =====================================================

-- Users can only see their own library items
CREATE POLICY "Users can view own library items"
  ON library_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own library items
CREATE POLICY "Users can insert own library items"
  ON library_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own library items
CREATE POLICY "Users can update own library items"
  ON library_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own library items
CREATE POLICY "Users can delete own library items"
  ON library_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: presentations Table Policies
-- =====================================================

-- Users can only see their own presentations
CREATE POLICY "Users can view own presentations"
  ON presentations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own presentations
CREATE POLICY "Users can insert own presentations"
  ON presentations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own presentations
CREATE POLICY "Users can update own presentations"
  ON presentations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own presentations
CREATE POLICY "Users can delete own presentations"
  ON presentations
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- STEP 6: presentation_slides Table Policies
-- =====================================================

-- Users can only see slides from their own presentations
CREATE POLICY "Users can view own presentation slides"
  ON presentation_slides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = presentation_slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

-- Users can only insert slides to their own presentations
CREATE POLICY "Users can insert own presentation slides"
  ON presentation_slides
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = presentation_slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

-- Users can only update slides from their own presentations
CREATE POLICY "Users can update own presentation slides"
  ON presentation_slides
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = presentation_slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = presentation_slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

-- Users can only delete slides from their own presentations
CREATE POLICY "Users can delete own presentation slides"
  ON presentation_slides
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM presentations
      WHERE presentations.id = presentation_slides.presentation_id
      AND presentations.user_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 7: Storage Bucket Policies
-- =====================================================
-- Note: Storage policies must be created in the Supabase UI
-- Navigation: Storage > Policies > New Policy
--
-- Bucket: 'uploads'
--
-- Policy 1: "Users can upload own files"
-- Operation: INSERT
-- Policy: bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy 2: "Users can view own files"
-- Operation: SELECT
-- Policy: bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy 3: "Users can delete own files"
-- Operation: DELETE
-- Policy: bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
-- =====================================================

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
  AND tablename IN ('conversations', 'messages', 'library_items', 'presentations', 'presentation_slides')
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

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- WARNING: Only use this if you need to remove all policies
-- This will make your data accessible to all users!
--
-- DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
-- DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
-- DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
-- DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
-- DROP POLICY IF EXISTS "Users can view own messages" ON messages;
-- DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
-- DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
-- DROP POLICY IF EXISTS "Users can view own library items" ON library_items;
-- DROP POLICY IF EXISTS "Users can insert own library items" ON library_items;
-- DROP POLICY IF EXISTS "Users can update own library items" ON library_items;
-- DROP POLICY IF EXISTS "Users can delete own library items" ON library_items;
-- DROP POLICY IF EXISTS "Users can view own presentations" ON presentations;
-- DROP POLICY IF EXISTS "Users can insert own presentations" ON presentations;
-- DROP POLICY IF EXISTS "Users can update own presentations" ON presentations;
-- DROP POLICY IF EXISTS "Users can delete own presentations" ON presentations;
-- DROP POLICY IF EXISTS "Users can view own presentation slides" ON presentation_slides;
-- DROP POLICY IF EXISTS "Users can insert own presentation slides" ON presentation_slides;
-- DROP POLICY IF EXISTS "Users can update own presentation slides" ON presentation_slides;
-- DROP POLICY IF EXISTS "Users can delete own presentation slides" ON presentation_slides;
--
-- ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE library_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE presentations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE presentation_slides DISABLE ROW LEVEL SECURITY;
-- =====================================================

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
-- If this script runs without errors, RLS is now enabled!
-- Next steps:
-- 1. Test with two different users
-- 2. Verify users can only see their own data
-- 3. Update your API routes to use auth.uid() instead of localStorage
-- =====================================================
