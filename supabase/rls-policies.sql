-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================
-- This file implements proper security policies for all tables
-- Users can only access their own data based on user_id

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CONVERSATIONS TABLE POLICIES
-- =====================================================

-- Policy: Users can view their own conversations
CREATE POLICY "Users can view own conversations"
ON conversations FOR SELECT
USING (user_id = current_setting('app.user_id', true));

-- Policy: Users can insert their own conversations
CREATE POLICY "Users can insert own conversations"
ON conversations FOR INSERT
WITH CHECK (user_id = current_setting('app.user_id', true));

-- Policy: Users can update their own conversations
CREATE POLICY "Users can update own conversations"
ON conversations FOR UPDATE
USING (user_id = current_setting('app.user_id', true))
WITH CHECK (user_id = current_setting('app.user_id', true));

-- Policy: Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
ON conversations FOR DELETE
USING (user_id = current_setting('app.user_id', true));

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

-- Policy: Users can view messages from their own conversations
CREATE POLICY "Users can view messages from own conversations"
ON messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id = current_setting('app.user_id', true)
  )
);

-- Policy: Users can insert messages to their own conversations
CREATE POLICY "Users can insert messages to own conversations"
ON messages FOR INSERT
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id = current_setting('app.user_id', true)
  )
);

-- Policy: Users can update messages in their own conversations
CREATE POLICY "Users can update messages in own conversations"
ON messages FOR UPDATE
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id = current_setting('app.user_id', true)
  )
)
WITH CHECK (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id = current_setting('app.user_id', true)
  )
);

-- Policy: Users can delete messages from their own conversations
CREATE POLICY "Users can delete messages from own conversations"
ON messages FOR DELETE
USING (
  conversation_id IN (
    SELECT id FROM conversations
    WHERE user_id = current_setting('app.user_id', true)
  )
);

-- =====================================================
-- LIBRARY ITEMS TABLE POLICIES
-- =====================================================

-- Policy: Users can view their own library items
CREATE POLICY "Users can view own library items"
ON library_items FOR SELECT
USING (user_id = current_setting('app.user_id', true));

-- Policy: Users can insert their own library items
CREATE POLICY "Users can insert own library items"
ON library_items FOR INSERT
WITH CHECK (user_id = current_setting('app.user_id', true));

-- Policy: Users can update their own library items
CREATE POLICY "Users can update own library items"
ON library_items FOR UPDATE
USING (user_id = current_setting('app.user_id', true))
WITH CHECK (user_id = current_setting('app.user_id', true));

-- Policy: Users can delete their own library items
CREATE POLICY "Users can delete own library items"
ON library_items FOR DELETE
USING (user_id = current_setting('app.user_id', true));

-- =====================================================
-- STORAGE POLICIES (for images and videos buckets)
-- =====================================================

-- Images Bucket Policies
CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images' AND (storage.foldername(name))[1] = current_setting('app.user_id', true));

CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = current_setting('app.user_id', true));

CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images' AND (storage.foldername(name))[1] = current_setting('app.user_id', true))
WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = current_setting('app.user_id', true));

CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (bucket_id = 'images' AND (storage.foldername(name))[1] = current_setting('app.user_id', true));

-- Videos Bucket Policies
CREATE POLICY "Users can view own videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = current_setting('app.user_id', true));

CREATE POLICY "Users can upload own videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = current_setting('app.user_id', true));

CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = current_setting('app.user_id', true))
WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = current_setting('app.user_id', true));

CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = current_setting('app.user_id', true));

-- =====================================================
-- NOTES FOR IMPLEMENTATION
-- =====================================================
--
-- IMPORTANT: These policies use current_setting('app.user_id', true)
-- This means you MUST set the user_id before making queries:
--
-- In your Supabase client code:
--   await supabase.rpc('set_user_id', { user_id: 'your_user_id' });
--
-- Or create a helper function:
--   CREATE OR REPLACE FUNCTION set_user_id(user_id text)
--   RETURNS void AS $$
--   BEGIN
--     PERFORM set_config('app.user_id', user_id, false);
--   END;
--   $$ LANGUAGE plpgsql;
--
-- =====================================================
