-- =====================================================
-- SUPERCHAT C1 MESSAGE FIX
-- =====================================================
-- This SQL script fixes messages that were generated with SuperChat
-- but have was_generated_with_c1 set to FALSE or NULL
--
-- PROBLEM: Messages containing C1 JSON with <content> tags are not
-- being rendered as interactive components because the flag is wrong
--
-- SOLUTION: Detect C1-formatted content and fix the flag
-- =====================================================

-- STEP 1: Check current state of messages
-- =====================================================
-- Run this first to see how many messages need fixing

SELECT
  'Total assistant messages' AS check_type,
  COUNT(*) AS count
FROM messages
WHERE role = 'assistant'

UNION ALL

SELECT
  'Messages with was_generated_with_c1 = TRUE' AS check_type,
  COUNT(*) AS count
FROM messages
WHERE role = 'assistant'
  AND was_generated_with_c1 = TRUE

UNION ALL

SELECT
  'Messages with was_generated_with_c1 = FALSE or NULL' AS check_type,
  COUNT(*) AS count
FROM messages
WHERE role = 'assistant'
  AND (was_generated_with_c1 = FALSE OR was_generated_with_c1 IS NULL)

UNION ALL

SELECT
  'Messages with <content> tags but flag = FALSE' AS check_type,
  COUNT(*) AS count
FROM messages
WHERE role = 'assistant'
  AND content LIKE '%<content>%'
  AND (was_generated_with_c1 = FALSE OR was_generated_with_c1 IS NULL);

-- STEP 2: Preview messages that will be fixed
-- =====================================================
-- Run this to see which messages will be updated

SELECT
  id,
  conversation_id,
  SUBSTRING(content, 1, 100) AS content_preview,
  was_generated_with_c1,
  is_c1_streaming,
  created_at
FROM messages
WHERE role = 'assistant'
  AND content LIKE '%<content>%'
  AND (was_generated_with_c1 = FALSE OR was_generated_with_c1 IS NULL)
ORDER BY created_at DESC;

-- STEP 3: Fix messages with C1 content
-- =====================================================
-- This updates all messages that have C1 JSON format but wrong flag
-- IMPORTANT: This will fix both old and new messages

UPDATE messages
SET
  was_generated_with_c1 = TRUE,
  is_c1_streaming = FALSE
WHERE role = 'assistant'
  AND content LIKE '%<content>%'
  AND (was_generated_with_c1 = FALSE OR was_generated_with_c1 IS NULL);

-- Verify the fix
SELECT
  'Messages fixed' AS result,
  COUNT(*) AS count
FROM messages
WHERE role = 'assistant'
  AND content LIKE '%<content>%'
  AND was_generated_with_c1 = TRUE;

-- STEP 4: Additional diagnostics
-- =====================================================
-- Check for messages with HTML-escaped content (another potential issue)

SELECT
  id,
  conversation_id,
  CASE
    WHEN content LIKE '%&quot;%' THEN 'Has &quot;'
    WHEN content LIKE '%&#39;%' THEN 'Has &#39;'
    WHEN content LIKE '%&lt;%' THEN 'Has &lt;'
    WHEN content LIKE '%&gt;%' THEN 'Has &gt;'
    ELSE 'No HTML entities'
  END AS html_status,
  SUBSTRING(content, 1, 150) AS content_preview,
  was_generated_with_c1,
  created_at
FROM messages
WHERE role = 'assistant'
  AND was_generated_with_c1 = TRUE
  AND (
    content LIKE '%&quot;%' OR
    content LIKE '%&#39;%' OR
    content LIKE '%&lt;%' OR
    content LIKE '%&gt;%'
  )
ORDER BY created_at DESC
LIMIT 20;

-- STEP 5: Check specific conversation (OPTIONAL)
-- =====================================================
-- Replace 'YOUR_CONVERSATION_ID' with actual ID if you want to check one conversation

-- SELECT
--   id,
--   role,
--   SUBSTRING(content, 1, 200) AS content_preview,
--   was_generated_with_c1,
--   is_c1_streaming,
--   generation_type,
--   timestamp
-- FROM messages
-- WHERE conversation_id = 'YOUR_CONVERSATION_ID'
-- ORDER BY timestamp ASC;

-- STEP 6: Final verification query
-- =====================================================
-- Run this after the fix to confirm everything is correct

SELECT
  'All C1 messages should now have flag = TRUE' AS verification,
  COUNT(*) AS total_c1_messages,
  COUNT(*) FILTER (WHERE was_generated_with_c1 = TRUE) AS correctly_flagged,
  COUNT(*) FILTER (WHERE was_generated_with_c1 = FALSE OR was_generated_with_c1 IS NULL) AS incorrectly_flagged
FROM messages
WHERE role = 'assistant'
  AND content LIKE '%<content>%';

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 1. The fix updates ALL messages with <content> tags to have was_generated_with_c1 = TRUE
-- 2. This is safe because ONLY SuperChat generates <content> tags
-- 3. After running this, reload your browser to see the changes
-- 4. If you still see raw JSON, check the browser console for debug logs
-- 5. The debug logs will show WHERE in the flow the flag is being lost
-- =====================================================
