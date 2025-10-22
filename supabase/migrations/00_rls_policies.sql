-- ============================================
-- Row Level Security (RLS) Policies
-- Updated for Actual Database Schema
-- ============================================
-- This file contains RLS policies for all tables to ensure users
-- can only access their own data and prevent unauthorized access.
--
-- NOTE: This uses Supabase Auth's auth.uid() for user identification
-- If your app uses custom user_id context (current_setting('app.user_id')),
-- see the existing migration files in supabase/migrations/008_enable_proper_rls.sql
--
-- To apply: Run this in Supabase SQL Editor or via CLI
-- ============================================

-- ============================================
-- IMPORTANT: Choose Your Auth Strategy
-- ============================================
-- Option 1: Supabase Auth (auth.uid()) - Recommended for new projects
-- Option 2: Custom user_id context (current_setting('app.user_id')) - Your current setup
--
-- This file provides BOTH options. Uncomment the one you want to use.
-- ============================================

-- ============================================
-- EXISTING TABLES (Based on your migrations)
-- ============================================
-- conversations
-- messages
-- library_items
-- branding
-- storage.objects
-- ============================================

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding ENABLE ROW LEVEL SECURITY;

-- ============================================
-- OPTION 1: Supabase Auth Policies (auth.uid())
-- ============================================
-- Use this if you're using Supabase Auth directly
-- Uncomment the policies below if you want to switch to this approach

/*
-- Conversations Table
CREATE POLICY "Users can view own conversations (auth)"
  ON conversations
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own conversations (auth)"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own conversations (auth)"
  ON conversations
  FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own conversations (auth)"
  ON conversations
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Messages Table
CREATE POLICY "Users can view own messages (auth)"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create own messages (auth)"
  ON messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own messages (auth)"
  ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own messages (auth)"
  ON messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()::text
    )
  );

-- Library Items Table
CREATE POLICY "Users can view own library items (auth)"
  ON library_items
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own library items (auth)"
  ON library_items
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own library items (auth)"
  ON library_items
  FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own library items (auth)"
  ON library_items
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Branding Table
CREATE POLICY "Users can view own branding (auth)"
  ON branding
  FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create own branding (auth)"
  ON branding
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own branding (auth)"
  ON branding
  FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own branding (auth)"
  ON branding
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- Storage Bucket Policies
CREATE POLICY "Users can upload to own folder (auth)"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read from own folder (auth)"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own files (auth)"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files (auth)"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
*/

-- ============================================
-- OPTION 2: Custom User ID Context (current_setting)
-- ============================================
-- This is your CURRENT setup based on existing migrations
-- These policies are ALREADY APPLIED in migration 008_enable_proper_rls.sql
-- Only use this as reference or if you need to recreate them

-- NOTE: If you're getting "relation does not exist" errors, it means:
-- 1. The tables haven't been created yet (run your schema migrations first)
-- 2. OR RLS policies are already applied (check existing policies)

-- To check existing policies:
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- To check if tables exist:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- ============================================
-- Verification Queries
-- ============================================

-- Check which tables have RLS enabled:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- Check all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- ============================================
-- Summary of Your Current Setup
-- ============================================
-- Your app uses a custom user ID context approach:
-- 1. Helper function: set_user_id(user_id text)
-- 2. Policies use: current_setting('app.user_id', true)
-- 3. Tables: conversations, messages, library_items, branding
-- 4. RLS is already enabled via migration 008_enable_proper_rls.sql
--
-- If you want to add NEW tables, follow this pattern:
--
-- CREATE POLICY "Users can view own <table>"
--   ON <table_name>
--   FOR SELECT
--   USING (user_id = current_setting('app.user_id', true));
--
-- CREATE POLICY "Users can create own <table>"
--   ON <table_name>
--   FOR INSERT
--   WITH CHECK (user_id = current_setting('app.user_id', true));
--
-- CREATE POLICY "Users can update own <table>"
--   ON <table_name>
--   FOR UPDATE
--   USING (user_id = current_setting('app.user_id', true));
--
-- CREATE POLICY "Users can delete own <table>"
--   ON <table_name>
--   FOR DELETE
--   USING (user_id = current_setting('app.user_id', true));
-- ============================================
