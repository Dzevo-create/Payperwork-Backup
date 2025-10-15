# SuperChat C1 - Quick Fix Reference

## Problem
Seeing raw JSON like `&quot;type&quot;:&quot;agent&quot;...` instead of interactive components?

## Quick Fix (3 Steps)

### Step 1: Fix Database (Old Messages)
Open Supabase SQL Editor and run:

```sql
UPDATE messages
SET was_generated_with_c1 = TRUE, is_c1_streaming = FALSE
WHERE role = 'assistant'
  AND content LIKE '%<content>%'
  AND (was_generated_with_c1 = FALSE OR was_generated_with_c1 IS NULL);
```

### Step 2: Clear Browser Cache
1. Open Browser (Chrome/Firefox/Safari)
2. Press `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
3. Clear cache and reload

### Step 3: Verify Fix
1. Open Browser Console (F12)
2. Send new SuperChat message
3. Look for these logs:

```
✅ GOOD: "🎯 Assistant message created: { wasGeneratedWithC1: true }"
✅ GOOD: "🔧 CRITICAL FIX: Preserving C1 flags"
✅ GOOD: "🎯 Checking C1 render condition: { willRenderC1: true }"

❌ BAD: "wasGeneratedWithC1: false"
❌ BAD: "willRenderC1: false"
```

## Still Not Working?

### Check SuperChat Toggle
- Is the toggle ON (green)?
- Look for log: `isSuperChatEnabled: true`

### Check Mode
- Are you in "chat" mode (not image/video)?
- Look for log: `mode: "chat"`

### Check Old Messages in DB
Run this in Supabase SQL Editor:

```sql
SELECT id, SUBSTRING(content, 1, 100), was_generated_with_c1
FROM messages
WHERE role = 'assistant'
  AND content LIKE '%<content>%'
ORDER BY timestamp DESC
LIMIT 10;
```

Should show `was_generated_with_c1: true`

## Need More Help?
Read the full guide: `C1_RENDERER_DEBUG_GUIDE.md`
