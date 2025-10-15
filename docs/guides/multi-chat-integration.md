# Multi-Chat System Integration Guide

## Overview

This guide provides step-by-step instructions for integrating the new conversation hooks and utilities into your Payperwork chat application.

**Status**: The multi-conversation system is already implemented. This guide covers how to use the new optimized hooks and utilities.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step-by-Step Integration](#step-by-step-integration)
3. [Using New Hooks](#using-new-hooks)
4. [Database Migration](#database-migration)
5. [Component Updates](#component-updates)
6. [Testing Checklist](#testing-checklist)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Plan](#rollback-plan)

---

## Prerequisites

### Required Software

- Node.js 18+
- npm or yarn
- Supabase CLI (for database migrations)
- PostgreSQL database (via Supabase)

### Environment Variables

Ensure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Verify Current Setup

1. Check that Supabase connection works:
   ```bash
   npm run dev
   # Open browser console, should see: "Loading conversations from Supabase..."
   ```

2. Verify database schema:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('conversations', 'messages');
   ```

   Should return both `conversations` and `messages`.

---

## Step-by-Step Integration

### Step 1: Apply Database Migration

The new migration adds performance enhancements and new features.

#### Option A: Using Supabase CLI (Recommended)

```bash
# Navigate to project root
cd /path/to/Payperwork

# Apply migration
npx supabase db push --db-url "postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"

# Or if you have supabase linked:
npx supabase migration up
```

#### Option B: Manual SQL Execution

1. Open Supabase Dashboard > SQL Editor
2. Copy contents of `supabase/migrations/003_conversation_enhancements.sql`
3. Paste and execute

#### Verify Migration

```sql
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
AND column_name IN ('message_count', 'last_message_preview', 'tags', 'is_archived');
```

Should return 4 rows.

### Step 2: Install Dependencies (if needed)

The new hooks don't require additional dependencies, but ensure you have:

```bash
npm install zustand @supabase/supabase-js
```

### Step 3: Update Store (if using old store)

Check which store is currently in use:

```bash
grep -r "from '@/store/chatStore'" components/ app/
```

If you see imports from `@/store/chatStore`, update to `@/store/chatStore.supabase`:

```typescript
// OLD (localStorage-only)
import { useChatStore } from '@/store/chatStore';

// NEW (Supabase-backed)
import { useChatStore } from '@/store/chatStore.supabase';
```

### Step 4: Gradually Adopt New Hooks

The new hooks provide cleaner abstractions. Adopt them incrementally:

#### Before: Direct Store Usage

```typescript
// components/chat/ChatLayout.tsx (OLD)
const conversations = useChatStore((state) => state.conversations);
const currentConversationId = useChatStore((state) => state.currentConversationId);
const addConversation = useChatStore((state) => state.addConversation);
const updateConversation = useChatStore((state) => state.updateConversation);
```

#### After: Using New Hooks

```typescript
// components/chat/ChatLayout.tsx (NEW)
import { useConversations, useConversationActions } from '@/hooks/conversations';

const {
  filteredConversations,
  currentConversation,
  isActive
} = useConversations({
  sortBy: 'updated_at',
  searchQuery: searchQuery
});

const {
  createConversation,
  deleteConversation,
  togglePin
} = useConversationActions();
```

### Step 5: Update ChatLayout Component (Example)

Here's how to refactor `ChatLayout.tsx`:

```typescript
// components/chat/ChatLayout.tsx
"use client";

import { useState } from "react";
import { useConversations, useConversationActions, useConversationSwitch } from "@/hooks/conversations";
import { ChatSidebar } from "./Sidebar/ChatSidebar";
import { ChatArea } from "./Chat/ChatArea";

export function ChatLayout() {
  const [searchQuery, setSearchQuery] = useState("");

  // Use new hooks
  const {
    filteredConversations,
    currentConversation,
    isActive,
    refresh
  } = useConversations({
    searchQuery,
    sortBy: 'updated_at'
  });

  const {
    createConversation,
    deleteConversation,
    renameConversation,
    duplicateConversation
  } = useConversationActions();

  const {
    switchTo,
    createAndSwitch
  } = useConversationSwitch({
    autoSave: true,
    enableKeyboardShortcuts: true
  });

  // Handlers
  const handleNewChat = () => {
    createAndSwitch();
  };

  const handleLoadConversation = (convId: string) => {
    switchTo(convId);
  };

  const handleDeleteConversation = async (convId: string) => {
    if (confirm('Wirklich löschen?')) {
      await deleteConversation(convId);
    }
  };

  return (
    <div className="h-screen flex">
      <ChatSidebar
        conversations={filteredConversations}
        currentConversationId={currentConversation?.id || null}
        onNewChat={handleNewChat}
        onLoadConversation={handleLoadConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={renameConversation}
        onDuplicateConversation={duplicateConversation}
        onSearch={setSearchQuery}
      />
      <ChatArea />
    </div>
  );
}
```

### Step 6: Enable Keyboard Shortcuts (Optional)

The `useConversationSwitch` hook supports keyboard shortcuts:

```typescript
const { switchTo, goToNext, goToPrevious } = useConversationSwitch({
  enableKeyboardShortcuts: true
});

// Now users can:
// - Cmd/Ctrl + ] = Next conversation
// - Cmd/Ctrl + [ = Previous conversation
// - Cmd/Ctrl + N = New conversation
// - Cmd/Ctrl + 1-9 = Switch to conversation by index
```

### Step 7: Test Integration

Follow the [Testing Checklist](#testing-checklist) below.

---

## Using New Hooks

### Hook: useConversations

Fetches and filters conversations.

```typescript
import { useConversations } from '@/hooks/conversations';

function MyComponent() {
  const {
    conversations,           // All conversations
    filteredConversations,   // Filtered by search/pinned
    currentConversation,     // Active conversation
    isLoading,
    error,
    refresh,                 // Reload from database
    isActive                 // Check if conversation is active
  } = useConversations({
    autoFetch: true,         // Auto-load on mount
    pinnedOnly: false,       // Show only pinned
    searchQuery: '',         // Search query
    sortBy: 'updated_at',    // Sort field
    sortDirection: 'desc'    // Sort direction
  });

  return (
    <div>
      {filteredConversations.map(conv => (
        <div key={conv.id} className={isActive(conv.id) ? 'active' : ''}>
          {conv.title}
        </div>
      ))}
    </div>
  );
}
```

### Hook: useConversationActions

Provides CRUD operations.

```typescript
import { useConversationActions } from '@/hooks/conversations';

function MyComponent() {
  const {
    createConversation,
    updateConversation,
    deleteConversation,
    duplicateConversation,
    togglePin,
    renameConversation,
    bulkDelete,
    exportConversation,
    isLoading,
    error,
    clearError
  } = useConversationActions();

  const handleCreate = async () => {
    const conv = await createConversation('My New Chat');
    console.log('Created:', conv.id);
  };

  const handleTogglePin = async (id: string) => {
    await togglePin(id);
  };

  const handleExport = async (id: string) => {
    const json = await exportConversation(id);
    // Download JSON file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${id}.json`;
    a.click();
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={isLoading}>
        Create
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### Hook: useConversationSwitch

Handles navigation between conversations.

```typescript
import { useConversationSwitch } from '@/hooks/conversations';

function MyComponent() {
  const {
    switchTo,
    goToNext,
    goToPrevious,
    createAndSwitch,
    isSwitching
  } = useConversationSwitch({
    autoSave: true,                 // Save before switching
    enableKeyboardShortcuts: true   // Enable Cmd/Ctrl shortcuts
  });

  return (
    <div>
      <button onClick={() => switchTo('conv-123')}>
        Switch to Conversation
      </button>
      <button onClick={goToNext}>Next</button>
      <button onClick={goToPrevious}>Previous</button>
      <button onClick={createAndSwitch}>New Chat</button>
      {isSwitching && <div>Switching...</div>}
    </div>
  );
}
```

### Hook: useConversationTitle

Manages conversation titles.

```typescript
import { useConversationTitle } from '@/hooks/conversations';

function MyComponent() {
  const {
    generateTitle,
    regenerateTitle,
    updateTitle,
    validateTitle,
    isGenerating,
    error
  } = useConversationTitle();

  const handleGenerate = async (convId: string) => {
    const title = await generateTitle(convId);
    console.log('Generated:', title);
  };

  const handleUpdate = async (convId: string, newTitle: string) => {
    const validation = validateTitle(newTitle);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    await updateTitle(convId, newTitle);
  };

  return (
    <div>
      <button onClick={() => handleGenerate('conv-123')} disabled={isGenerating}>
        Generate Title
      </button>
      {error && <div>{error}</div>}
    </div>
  );
}
```

---

## Database Migration

### Migration Script: `003_conversation_enhancements.sql`

This migration adds:

**New Columns**:
- `message_count`: Denormalized message count (auto-updated via trigger)
- `last_message_preview`: First 100 chars of last message
- `last_message_at`: Timestamp of last message
- `tags`: Array of tags for categorization
- `is_archived`: Soft delete flag
- `is_favorite`: Favorite flag
- `metadata`: Extensible JSONB field

**New Indexes**:
- `idx_conversations_is_archived`: Fast archived filter
- `idx_conversations_is_favorite`: Fast favorite filter
- `idx_conversations_last_message_at`: Fast sorting
- `idx_conversations_tags`: GIN index for tag queries
- `idx_conversations_user_archived_updated`: Composite index for common query

**Triggers**:
- Auto-update `message_count`, `last_message_preview`, `last_message_at` when messages change

**Helper Functions**:
- `archive_old_conversations(days)`: Archive old conversations
- `get_conversation_summary(id)`: Get conversation stats

### Testing Migration

```sql
-- Test 1: Verify new columns
SELECT
  id,
  title,
  message_count,
  last_message_preview,
  is_archived,
  tags
FROM conversations
LIMIT 5;

-- Test 2: Check trigger works
INSERT INTO messages (conversation_id, role, content, timestamp)
VALUES ('existing-conv-id', 'user', 'Test message', NOW());

-- Verify message_count incremented
SELECT id, message_count FROM conversations WHERE id = 'existing-conv-id';

-- Test 3: Test helper function
SELECT * FROM get_conversation_summary('existing-conv-id');

-- Test 4: Archive old conversations
SELECT archive_old_conversations(90); -- Archive conversations older than 90 days
```

---

## Component Updates

### Optional: Create ConversationCard Component

Create a reusable conversation card:

```typescript
// components/chat/Conversations/ConversationCard.tsx
"use client";

import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Pin, Archive, Trash2, Copy, Edit2 } from 'lucide-react';
import { Conversation } from '@/types/chat';

interface ConversationCardProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onPin: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onRename: () => void;
}

export function ConversationCard({
  conversation,
  isActive,
  onClick,
  onPin,
  onDelete,
  onDuplicate,
  onRename
}: ConversationCardProps) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const timeAgo = formatDistanceToNow(conversation.updatedAt, {
    addSuffix: true,
    locale: de
  });

  return (
    <div
      className={`
        p-3 rounded-lg cursor-pointer transition-all
        ${isActive
          ? 'bg-pw-accent/10 border-l-2 border-pw-accent'
          : 'hover:bg-pw-black/5'
        }
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {conversation.isPinned && (
              <Pin className="w-3 h-3 text-pw-accent" />
            )}
            <h3 className="font-medium text-sm truncate">
              {conversation.title}
            </h3>
          </div>

          {lastMessage && (
            <p className="text-xs text-pw-black/60 truncate mt-1">
              {lastMessage.content}
            </p>
          )}

          <p className="text-xs text-pw-black/40 mt-1">
            {timeAgo} · {conversation.messages.length} Nachrichten
          </p>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            className="p-1 hover:bg-pw-black/10 rounded"
            title="Anheften"
          >
            <Pin className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="p-1 hover:bg-pw-black/10 rounded"
            title="Umbenennen"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 hover:bg-pw-black/10 rounded"
            title="Duplizieren"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="Löschen"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Testing Checklist

### Functional Testing

- [ ] **Conversation Creation**
  - [ ] Click "New Chat" creates empty conversation
  - [ ] First message auto-creates conversation
  - [ ] Title auto-generated from first message
  - [ ] Conversation appears in sidebar immediately

- [ ] **Conversation Loading**
  - [ ] Click conversation loads messages
  - [ ] Active conversation highlighted
  - [ ] Messages persist when switching
  - [ ] URL parameter loading works (`?convId=xxx`)
  - [ ] Page refresh restores active conversation

- [ ] **Conversation Management**
  - [ ] Rename conversation
  - [ ] Delete conversation (with confirmation)
  - [ ] Duplicate conversation
  - [ ] Pin/unpin conversation
  - [ ] Pinned conversations stay at top

- [ ] **Message Features**
  - [ ] Send text message
  - [ ] Upload image attachment
  - [ ] Generate image
  - [ ] Generate video
  - [ ] Reply to message
  - [ ] Super Chat (C1) mode

- [ ] **Search & Filter**
  - [ ] Search finds conversations by title
  - [ ] Search finds conversations by message content
  - [ ] Keyboard shortcut (CMD/CTRL + K) opens search
  - [ ] Clicking result navigates to conversation

- [ ] **Keyboard Shortcuts** (if enabled)
  - [ ] CMD/CTRL + N creates new conversation
  - [ ] CMD/CTRL + ] goes to next conversation
  - [ ] CMD/CTRL + [ goes to previous conversation
  - [ ] CMD/CTRL + 1-9 switches to conversation by index

- [ ] **Persistence**
  - [ ] Conversations persist after refresh
  - [ ] Messages persist after refresh
  - [ ] Active conversation restores after refresh
  - [ ] Pinned status persists

- [ ] **Edge Cases**
  - [ ] Empty conversation list shows welcome
  - [ ] Delete active conversation resets UI
  - [ ] Delete last conversation works
  - [ ] Rapid switching doesn't cause errors
  - [ ] Offline mode shows appropriate error

### Performance Testing

- [ ] **Load Time**
  - [ ] App loads within 2 seconds
  - [ ] Conversations load within 1 second
  - [ ] Switching conversations feels instant

- [ ] **Large Data Sets**
  - [ ] 100+ conversations load smoothly
  - [ ] 500+ messages in conversation render smoothly
  - [ ] Search with 100+ conversations is fast

- [ ] **Database Queries**
  - [ ] Open DevTools > Network
  - [ ] Verify no duplicate Supabase requests
  - [ ] Verify optimistic updates (no spinner on most actions)

### Database Testing

Run these SQL queries to verify data integrity:

```sql
-- Test 1: Check conversations have correct message counts
SELECT
  c.id,
  c.message_count,
  COUNT(m.id) as actual_count
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id, c.message_count
HAVING c.message_count != COUNT(m.id);
-- Should return 0 rows (all counts match)

-- Test 2: Check last_message_at matches actual last message
SELECT
  c.id,
  c.last_message_at,
  MAX(m.timestamp) as actual_last_message_at
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id, c.last_message_at
HAVING c.last_message_at != MAX(m.timestamp);
-- Should return 0 rows (all timestamps match)

-- Test 3: Check for orphaned messages
SELECT COUNT(*) FROM messages m
WHERE NOT EXISTS (
  SELECT 1 FROM conversations c WHERE c.id = m.conversation_id
);
-- Should return 0 (no orphaned messages)

-- Test 4: Check RLS policies work
SET app.current_user_id = 'test-user-123';
SELECT COUNT(*) FROM conversations WHERE user_id != 'test-user-123';
-- Should return 0 (RLS enforced)
```

### Error Handling Testing

- [ ] **Network Errors**
  - [ ] Disconnect internet, verify error message
  - [ ] Reconnect, verify auto-recovery

- [ ] **Database Errors**
  - [ ] Invalid conversation ID shows error
  - [ ] Delete non-existent conversation shows error

- [ ] **Validation Errors**
  - [ ] Empty title shows validation error
  - [ ] Title > 100 chars shows validation error

### Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Accessibility Testing

- [ ] Tab navigation works
- [ ] Screen reader announces conversation titles
- [ ] Keyboard shortcuts documented
- [ ] ARIA labels present

---

## Troubleshooting

### Issue: Hooks cause "Cannot read property of undefined"

**Cause**: Store not hydrated yet

**Solution**: Add loading check
```typescript
const { isHydrated } = useChatStore();

if (!isHydrated) {
  return <div>Loading...</div>;
}
```

### Issue: Conversations not updating after migration

**Cause**: Migration didn't backfill data

**Solution**: Run backfill script
```sql
-- Backfill message counts
UPDATE conversations c
SET message_count = (
  SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id
);
```

### Issue: Keyboard shortcuts not working

**Cause**: Not enabled in hook

**Solution**: Enable in hook options
```typescript
useConversationSwitch({
  enableKeyboardShortcuts: true // Add this
});
```

### Issue: Search is slow with many conversations

**Cause**: Client-side filtering

**Solution**: Implement server-side search
```typescript
// TODO: Add Supabase full-text search
// See: https://supabase.com/docs/guides/database/full-text-search
```

### Issue: Migration fails with "column already exists"

**Cause**: Migration already applied

**Solution**: Check migration status
```sql
SELECT * FROM schema_migrations;
```

If needed, manually skip columns:
```sql
-- Modify migration to use IF NOT EXISTS (already included)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
```

---

## Rollback Plan

If you need to rollback changes:

### Step 1: Revert Component Changes

```bash
git checkout HEAD -- components/chat/ChatLayout.tsx
# Repeat for other modified components
```

### Step 2: Revert to Old Store (if needed)

```typescript
// Change back to old store
import { useChatStore } from '@/store/chatStore'; // OLD
```

### Step 3: Rollback Database Migration (Optional)

```sql
-- Drop new columns (data will be lost!)
ALTER TABLE conversations
  DROP COLUMN IF EXISTS message_count,
  DROP COLUMN IF EXISTS last_message_preview,
  DROP COLUMN IF EXISTS last_message_at,
  DROP COLUMN IF EXISTS tags,
  DROP COLUMN IF EXISTS is_archived,
  DROP COLUMN IF EXISTS is_favorite,
  DROP COLUMN IF EXISTS metadata;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message_insert ON messages;
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message_delete ON messages;
DROP FUNCTION IF EXISTS update_conversation_metadata;
DROP FUNCTION IF EXISTS update_conversation_on_message_delete;

-- Drop indexes
DROP INDEX IF EXISTS idx_conversations_is_archived;
DROP INDEX IF EXISTS idx_conversations_is_favorite;
DROP INDEX IF EXISTS idx_conversations_last_message_at;
DROP INDEX IF EXISTS idx_conversations_tags;
DROP INDEX IF EXISTS idx_conversations_user_archived_updated;

-- Drop view
DROP VIEW IF EXISTS conversations_with_stats;

-- Drop helper functions
DROP FUNCTION IF EXISTS archive_old_conversations;
DROP FUNCTION IF EXISTS get_conversation_summary;
```

**NOTE**: Only rollback database if absolutely necessary. The new columns are backward compatible.

---

## Next Steps

After successful integration:

1. **Monitor Performance**
   - Use browser DevTools to monitor load times
   - Check Supabase Dashboard for slow queries
   - Set up error tracking (e.g., Sentry)

2. **Implement Advanced Features**
   - Conversation export/import
   - Conversation sharing (public links)
   - Conversation templates
   - Advanced search (full-text)

3. **Optimize Further**
   - Implement message pagination
   - Add virtual scrolling for long conversations
   - Implement conversation pagination (for 100+ conversations)
   - Add Redis caching layer (optional)

4. **Enhance Security**
   - Migrate to Supabase Auth
   - Implement proper RLS policies
   - Add rate limiting
   - Add input validation

5. **Documentation**
   - Update README with new hooks
   - Create video tutorials
   - Write blog post about architecture

---

## Support

For issues or questions:

1. Check the [Architecture Documentation](../architecture/multi-chat.md)
2. Review [Troubleshooting](#troubleshooting) section
3. Check browser console for errors
4. Review Supabase logs in dashboard

**Remember**: The system is already working! These new hooks and utilities are enhancements, not requirements.
