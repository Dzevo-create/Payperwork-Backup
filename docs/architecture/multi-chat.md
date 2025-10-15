# Multi-Chat/Conversation System Architecture

## Executive Summary

The Payperwork chat application implements a robust multi-conversation system with Supabase as the source of truth. This document details the architecture, database design, state management, and provides implementation guidelines.

**Status**: IMPLEMENTED (with optimization opportunities)

**Tech Stack**: Next.js 15.5.4, TypeScript, Supabase PostgreSQL, Zustand

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Architecture](#database-architecture)
3. [State Management](#state-management)
4. [File Structure](#file-structure)
5. [API Layer](#api-layer)
6. [UI Components](#ui-components)
7. [Data Flow](#data-flow)
8. [Migration Strategy](#migration-strategy)
9. [Performance Optimization](#performance-optimization)
10. [Testing Strategy](#testing-strategy)

---

## System Overview

### Current Implementation

The application already has a fully functional multi-conversation system with the following capabilities:

- **Multiple Conversations**: Users can create unlimited isolated chat threads
- **Persistent Storage**: Conversations and messages stored in Supabase PostgreSQL
- **Optimistic Updates**: UI updates immediately, syncs to database in background
- **Auto-Hydration**: State automatically loads from Supabase on app start
- **User Scoping**: All conversations are scoped to user_id (localStorage-based)
- **Rich Features**: Supports text, image generation, video generation, and Super Chat (C1)

### Architecture Principles

1. **Single Source of Truth**: Supabase database is the authoritative data source
2. **Optimistic UI**: Updates happen immediately in UI, sync to DB asynchronously
3. **Separation of Concerns**: Clear boundaries between data layer, state, and UI
4. **Type Safety**: Strict TypeScript throughout the codebase
5. **DRY Principle**: Reusable hooks and components for common operations

---

## Database Architecture

### Entity Relationship Diagram (Text-Based)

```
┌─────────────────────────────────────────────┐
│ conversations                               │
├─────────────────────────────────────────────┤
│ PK  id              UUID                    │
│     title           TEXT                    │
│     user_id         TEXT                    │
│     created_at      TIMESTAMPTZ             │
│     updated_at      TIMESTAMPTZ             │
│     is_pinned       BOOLEAN                 │
└─────────────────────────────────────────────┘
                    │
                    │ 1:N (CASCADE DELETE)
                    ▼
┌─────────────────────────────────────────────┐
│ messages                                    │
├─────────────────────────────────────────────┤
│ PK  id                    UUID              │
│ FK  conversation_id       UUID              │
│     role                  TEXT              │
│     content               TEXT              │
│     timestamp             TIMESTAMPTZ       │
│     attachments           JSONB             │
│     video_task            JSONB             │
│     was_generated_with_c1 BOOLEAN           │
│     generation_type       TEXT              │
│     generation_attempt    INTEGER           │
│     generation_max_attempts INTEGER         │
│     is_c1_streaming       BOOLEAN           │
│     reply_to              JSONB             │
└─────────────────────────────────────────────┘
```

### Schema Details

#### Conversations Table

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL DEFAULT 'Neue Konversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  is_pinned BOOLEAN DEFAULT FALSE
);
```

**Fields**:
- `id`: Unique identifier (UUID v4)
- `title`: Conversation title (auto-generated from first message)
- `user_id`: User identifier from localStorage (format: `user_{timestamp}_{random}`)
- `created_at`: Creation timestamp (immutable)
- `updated_at`: Last update timestamp (auto-updated via trigger)
- `is_pinned`: Pin conversation to top of list

**Indexes**:
```sql
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
```

#### Messages Table

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attachments JSONB DEFAULT '[]'::jsonb,
  video_task JSONB,
  was_generated_with_c1 BOOLEAN DEFAULT FALSE,
  generation_type TEXT DEFAULT 'text' CHECK (generation_type IN ('image', 'video', 'text')),
  generation_attempt INTEGER,
  generation_max_attempts INTEGER,
  is_c1_streaming BOOLEAN DEFAULT FALSE,
  reply_to JSONB
);
```

**Fields**:
- `id`: Unique identifier (UUID v4)
- `conversation_id`: Foreign key to conversations (CASCADE DELETE)
- `role`: Message sender ('user' or 'assistant')
- `content`: Message text content
- `timestamp`: Message creation time
- `attachments`: Array of attachment objects (images, PDFs, videos)
- `video_task`: Video generation metadata (status, progress, etc.)
- `was_generated_with_c1`: Super Chat (Claude-1) flag
- `generation_type`: 'text', 'image', or 'video'
- `generation_attempt`: Current retry attempt (for video/image generation)
- `generation_max_attempts`: Max retries allowed
- `is_c1_streaming`: C1 streaming indicator
- `reply_to`: Referenced message data (messageId, content)

**Indexes**:
```sql
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_messages_was_generated_with_c1 ON messages(was_generated_with_c1);
CREATE INDEX idx_messages_generation_type ON messages(generation_type);
```

### Database Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### Row Level Security (RLS)

Currently using permissive policies (allow all). For production, recommend:

```sql
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy for conversations (user can only access their own)
CREATE POLICY "Users can access own conversations"
  ON conversations FOR ALL
  USING (user_id = current_setting('app.current_user_id', TRUE));

-- Policy for messages (via conversation)
CREATE POLICY "Users can access messages in their conversations"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = current_setting('app.current_user_id', TRUE)
    )
  );
```

**Note**: Current implementation uses simple text-based user_id. For production authentication, migrate to Supabase Auth.

---

## State Management

### Store Architecture

The application uses Zustand with Supabase integration: `store/chatStore.supabase.ts`

#### Store Structure

```typescript
interface ChatStore {
  // State
  messages: Message[];                    // Current conversation messages
  conversations: Conversation[];          // All user conversations
  currentConversationId: string | null;   // Active conversation ID
  isGenerating: boolean;                  // Loading state
  error: ChatError | null;                // Error state
  isHydrated: boolean;                    // Data loaded from Supabase

  // Hydration
  hydrate: () => Promise<void>;

  // Message Actions (async - sync to Supabase)
  addMessage: (message: Message) => Promise<void>;
  updateMessage: (id: string, content: string) => Promise<void>;
  updateMessageWithAttachments: (...) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  setMessages: (messages: Message[]) => void;

  // Conversation Actions (async - sync to Supabase)
  addConversation: (conversation: Conversation) => Promise<void>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setConversations: (conversations: Conversation[]) => void;

  // UI State Actions
  setCurrentConversationId: (id: string | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: ChatError | null) => void;
  clearMessages: () => void;
  clearError: () => void;
}
```

#### Key Features

1. **Auto-Hydration on Mount**:
```typescript
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useChatStore.getState().hydrate();
  }, 0);
}
```

2. **Optimistic Updates**:
```typescript
addMessage: async (message) => {
  // Optimistic: Update UI immediately
  set((state) => ({
    messages: [...state.messages, message],
    conversations: state.conversations.map(conv =>
      conv.id === conversationId
        ? { ...conv, messages: [...conv.messages, message] }
        : conv
    )
  }));

  // Async: Sync to database
  if (conversationId) {
    await createMessageSupabase(conversationId, message);
  }
}
```

3. **Conversation Switching**:
```typescript
setCurrentConversationId: (id) => {
  const conversation = get().conversations.find(c => c.id === id);

  // Persist to localStorage for reload recovery
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentConversationId', id);
  }

  // Load messages from conversation
  set({
    currentConversationId: id,
    messages: conversation?.messages || []
  });
}
```

### Type Definitions

Located in `types/chat.ts`:

```typescript
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  replyTo?: {
    messageId: string;
    content: string;
  };
  generationType?: "image" | "video" | "text";
  generationAttempt?: number;
  generationMaxAttempts?: number;
  isC1Streaming?: boolean;
  wasGeneratedWithC1?: boolean;
  videoTask?: VideoTask;
  imageTask?: ImageTask;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
}

export interface ChatError {
  message: string;
  code?: string;
  retryable?: boolean;
}
```

---

## File Structure

### Current Structure

```
/Users/dzevahiraliti/.../Payperwork/
├── app/
│   ├── api/
│   │   ├── chat/route.ts                  # Main chat API endpoint
│   │   ├── chat-c1/route.ts               # Super Chat (C1) endpoint
│   │   ├── generate-chat-title/route.ts   # Auto-title generation
│   │   └── ...
│   └── chat/
│       └── page.tsx                        # Chat page route
│
├── components/
│   └── chat/
│       ├── ChatLayout.tsx                  # Main layout orchestrator
│       ├── Chat/
│       │   ├── ChatArea.tsx                # Main chat area
│       │   ├── ChatHeader.tsx              # Header with menu
│       │   ├── ChatInput.tsx               # Message input
│       │   └── ChatMessages.tsx            # Message list
│       └── Sidebar/
│           ├── ChatSidebar.tsx             # Main sidebar
│           ├── ConversationList.tsx        # Conversation list
│           ├── NewChatButton.tsx           # New chat button
│           ├── SidebarSearch.tsx           # Search input
│           ├── SearchModal.tsx             # Search modal
│           └── SidebarFooter.tsx           # User info/credits
│
├── hooks/
│   └── chat/
│       ├── useImageGeneration.ts           # Image generation logic
│       ├── useVideoGeneration.ts           # Video generation logic
│       ├── useMessageActions.ts            # Message operations
│       ├── useReplyMessage.ts              # Reply functionality
│       └── useChatSearch.ts                # Search functionality
│
├── lib/
│   ├── supabase.ts                         # Supabase client
│   ├── supabase-chat.ts                    # Chat CRUD operations
│   └── supabase/
│       └── auth.ts                         # User ID management
│
├── store/
│   ├── chatStore.ts                        # Old localStorage-only store
│   └── chatStore.supabase.ts               # NEW Supabase-backed store
│
├── supabase/
│   ├── schema.sql                          # Main schema
│   ├── migrations/
│   │   └── 002_add_message_fields.sql      # C1 fields migration
│   └── rls-policies.sql                    # RLS policies
│
└── types/
    └── chat.ts                             # TypeScript types
```

### Recommended Structure (Future Enhancement)

```
hooks/
└── conversations/                          # NEW: Conversation-specific hooks
    ├── useConversations.ts                 # Fetch/list conversations
    ├── useConversationActions.ts           # CRUD operations
    ├── useConversationSwitch.ts            # Switch between conversations
    ├── useConversationTitle.ts             # Auto-title generation
    └── index.ts                            # Barrel export

lib/
└── conversations/                          # NEW: Conversation utilities
    ├── title-generator.ts                  # Title generation logic
    ├── conversation-sorter.ts              # Sorting/filtering logic
    └── index.ts                            # Barrel export

components/
└── chat/
    └── Conversations/                      # NEW: Conversation components
        ├── ConversationCard.tsx            # Individual conversation card
        ├── ConversationMenu.tsx            # Dropdown menu
        ├── ConversationSearch.tsx          # Search within conversations
        └── index.ts                        # Barrel export
```

---

## API Layer

### Database Operations: `lib/supabase-chat.ts`

#### Conversation Operations

```typescript
/**
 * Fetch all conversations for current user
 */
export async function fetchConversations(): Promise<Conversation[]>

/**
 * Create new conversation
 */
export async function createConversation(
  conversation: Conversation
): Promise<Conversation | null>

/**
 * Update conversation (title, isPinned, etc.)
 */
export async function updateConversation(
  id: string,
  updates: Partial<Conversation>
): Promise<void>

/**
 * Delete conversation (cascades to messages)
 */
export async function deleteConversation(id: string): Promise<void>
```

#### Message Operations

```typescript
/**
 * Fetch all messages for a conversation
 */
export async function fetchMessages(
  conversationId: string
): Promise<Message[]>

/**
 * Create new message in conversation
 */
export async function createMessage(
  conversationId: string,
  message: Message
): Promise<Message | null>

/**
 * Update existing message
 */
export async function updateMessage(
  id: string,
  updates: Partial<Message>
): Promise<void>

/**
 * Delete message
 */
export async function deleteMessage(id: string): Promise<void>
```

### User Identification: `lib/supabase/auth.ts`

```typescript
/**
 * Get or generate user ID (localStorage-based)
 */
export function getUserId(): string

/**
 * Set specific user ID (for testing/migration)
 */
export function setUserId(userId: string): void

/**
 * Clear user ID (logout)
 */
export function clearUserId(): void
```

**Current Implementation**: Simple localStorage-based identification
**Future Enhancement**: Migrate to Supabase Auth with proper authentication

---

## UI Components

### Component Hierarchy

```
ChatLayout
├── ChatSidebar
│   ├── SidebarHeader (collapse/expand)
│   ├── NewChatButton
│   ├── SidebarSearch
│   ├── ConversationList
│   │   └── ConversationItem (multiple)
│   │       └── ConversationMenu (rename/delete/duplicate)
│   └── SidebarFooter (credits/profile)
└── ChatArea
    ├── ChatHeader (menu button)
    ├── ChatMessages
    │   └── Message (multiple)
    │       ├── Attachments
    │       ├── VideoPlayer
    │       └── ImageGrid
    └── ChatInput
        ├── InputToolbar
        ├── AttachmentGrid
        └── InputActions
```

### Key Component Behaviors

#### ChatLayout (`components/chat/ChatLayout.tsx`)

**Responsibilities**:
- Orchestrate conversation loading/switching
- Handle "New Chat" action
- Auto-generate conversation title from first message
- Manage sidebar open/close state
- Handle URL parameters (e.g., `?convId=xxx` from library)

**Key Methods**:
```typescript
handleNewChat(): void              // Create new conversation
handleLoadConversation(id): void   // Switch to conversation
handleDeleteConversation(id): void // Delete conversation
handleRenameConversation(id, title): void
handleDuplicateConversation(id): void
```

#### ChatSidebar (`components/chat/Sidebar/ChatSidebar.tsx`)

**Responsibilities**:
- Display conversation list (sorted by updated_at DESC)
- Highlight active conversation
- Provide conversation actions (rename, delete, duplicate)
- Show library link with unseen count badge
- Handle search modal

**Props**:
```typescript
interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewChat: () => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onDuplicateConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
}
```

#### ConversationList (`components/chat/Sidebar/ConversationList.tsx`)

**Responsibilities**:
- Render list of conversations
- Show last message preview
- Show timestamp (relative: "2h ago", "Yesterday", etc.)
- Handle empty state
- Provide per-conversation menu

#### SearchModal (`components/chat/Sidebar/SearchModal.tsx`)

**Responsibilities**:
- Search across all conversations
- Show results grouped by conversation
- Navigate to specific conversation/message
- Keyboard shortcuts (CMD/CTRL + K)

---

## Data Flow

### Conversation Creation Flow

```
User clicks "New Chat"
    ↓
ChatLayout.handleNewChat()
    ↓
setCurrentConversationId(null)
setMessages([])
    ↓
[User types first message]
    ↓
ChatArea submits message
    ↓
1. Create conversation in DB
   store.addConversation({ id, title: "Neuer Chat", ... })
    ↓
2. Add message to DB
   store.addMessage({ role: "user", content, ... })
    ↓
3. Generate title from first message
   fetch('/api/generate-chat-title')
    ↓
4. Update conversation title
   store.updateConversation(id, { title })
    ↓
5. Get AI response
   fetch('/api/chat' or '/api/chat-c1')
    ↓
6. Add assistant message
   store.addMessage({ role: "assistant", content, ... })
    ↓
Conversation appears in sidebar
```

### Conversation Loading Flow

```
User clicks conversation in sidebar
    ↓
ChatSidebar.onLoadConversation(convId)
    ↓
ChatLayout.handleLoadConversation(convId)
    ↓
store.setCurrentConversationId(convId)
    ↓
Store loads messages from conversation object
    ↓
ChatMessages component renders messages
    ↓
User can continue conversation
```

### Message Update Flow (Optimistic)

```
User sends message / Attachment added
    ↓
1. Optimistic Update (immediate)
   set((state) => ({
     messages: [...state.messages, newMessage],
     conversations: state.conversations.map(...)
   }))
    ↓
   UI updates immediately
    ↓
2. Database Sync (background)
   await createMessageSupabase(convId, message)
    ↓
   If error: Log error (don't revert - retry on next action)
    ↓
3. Conversation updated_at auto-updated
   (via database trigger)
    ↓
   Next fetch will have correct sort order
```

### Hydration Flow (App Start)

```
App loads (page refresh)
    ↓
store.hydrate() called automatically
    ↓
1. Fetch all conversations from Supabase
   fetchConversations()
    ↓
2. Fetch messages for each conversation
   (done in parallel via Promise.all)
    ↓
3. Restore currentConversationId from localStorage
    ↓
4. Load messages for current conversation
    ↓
5. Set isHydrated = true
    ↓
UI renders with restored state
```

---

## Migration Strategy

### Current State

The system is **already migrated** to Supabase. The old `chatStore.ts` (localStorage-only) still exists but is not in use.

### Verification Steps

1. Check which store is imported in components:
   ```bash
   grep -r "from '@/store/chatStore" components/
   ```

2. If using old store, replace imports:
   ```typescript
   // Old
   import { useChatStore } from '@/store/chatStore';

   // New
   import { useChatStore } from '@/store/chatStore.supabase';
   ```

3. Test hydration:
   - Open DevTools console
   - Look for: "Loading conversations from Supabase..."
   - Verify conversations appear in sidebar

### Rollback Plan (if needed)

If issues arise, can temporarily revert:

1. Change import back to `chatStore.ts`
2. Data in Supabase is preserved
3. Fix issues
4. Re-migrate

### Data Migration Script

If you need to migrate old localStorage data to Supabase:

```typescript
// migration-script.ts
import { getUserId } from '@/lib/supabase/auth';
import { createConversation, createMessage } from '@/lib/supabase-chat';

async function migrateLocalStorageToSupabase() {
  // 1. Get old data from localStorage
  const oldData = localStorage.getItem('payperwork-chat-storage');
  if (!oldData) return;

  const { conversations } = JSON.parse(oldData);

  // 2. Create conversations in Supabase
  for (const conv of conversations) {
    await createConversation(conv);

    // 3. Create messages for each conversation
    for (const msg of conv.messages) {
      await createMessage(conv.id, msg);
    }
  }

  // 4. Clear old localStorage data
  localStorage.removeItem('payperwork-chat-storage');

  console.log('Migration complete!');
}
```

---

## Performance Optimization

### Current Optimizations

1. **Indexed Queries**:
   - `idx_conversations_user_id`: Fast user-specific queries
   - `idx_conversations_updated_at`: Fast sorting
   - `idx_messages_conversation_id`: Fast message fetch
   - `idx_messages_timestamp`: Fast message ordering

2. **Optimistic Updates**:
   - UI updates immediately (no loading spinners for most actions)
   - Database sync happens in background

3. **Efficient Hydration**:
   - Parallel message fetching (`Promise.all`)
   - Only fetch conversations for current user

4. **Lazy Loading**:
   - ChatArea loaded dynamically (`dynamic()` import)
   - Reduces initial bundle size

### Future Optimizations

#### 1. Pagination for Conversations

For users with 100+ conversations:

```typescript
// Add to fetchConversations
export async function fetchConversations(
  limit: number = 50,
  offset: number = 0
): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', getUserId())
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // ...
}
```

#### 2. Virtual Scrolling for Messages

For conversations with 1000+ messages:

```typescript
// Use react-window or react-virtualized
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={100}
>
  {({ index, style }) => (
    <MessageRow message={messages[index]} style={style} />
  )}
</FixedSizeList>
```

#### 3. Message Pagination

Load messages in chunks:

```typescript
export async function fetchMessages(
  conversationId: string,
  limit: number = 100,
  beforeTimestamp?: Date
): Promise<Message[]> {
  let query = supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true })
    .limit(limit);

  if (beforeTimestamp) {
    query = query.lt('timestamp', beforeTimestamp.toISOString());
  }

  // ...
}
```

#### 4. Debounced Auto-Save

For title updates and other frequent operations:

```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedUpdateTitle = useDebouncedCallback(
  (id: string, title: string) => {
    updateConversation(id, { title });
  },
  1000 // Wait 1s after last keystroke
);
```

#### 5. Stale-While-Revalidate Pattern

Cache conversations, refresh in background:

```typescript
export async function fetchConversations(): Promise<Conversation[]> {
  // 1. Return cached data immediately
  const cached = sessionStorage.getItem('conversations-cache');
  if (cached) {
    setTimeout(() => {
      // 2. Refresh in background
      fetchAndUpdateCache();
    }, 0);
    return JSON.parse(cached);
  }

  // 3. No cache, fetch and cache
  return fetchAndUpdateCache();
}
```

### Performance Monitoring

Add performance tracking:

```typescript
// In hydrate()
const startTime = performance.now();
const conversations = await fetchConversations();
const duration = performance.now() - startTime;

console.log(`Hydration took ${duration}ms`);

// Send to analytics (optional)
if (duration > 1000) {
  analytics.track('slow_hydration', { duration, count: conversations.length });
}
```

---

## Testing Strategy

### Unit Tests

#### Store Tests (`store/chatStore.supabase.test.ts`)

```typescript
describe('ChatStore', () => {
  it('should hydrate conversations from Supabase', async () => {
    const store = useChatStore.getState();
    await store.hydrate();
    expect(store.isHydrated).toBe(true);
    expect(Array.isArray(store.conversations)).toBe(true);
  });

  it('should add message optimistically', async () => {
    const store = useChatStore.getState();
    const initialCount = store.messages.length;

    await store.addMessage({
      id: 'test-123',
      role: 'user',
      content: 'Test message',
      timestamp: new Date()
    });

    expect(store.messages.length).toBe(initialCount + 1);
  });

  it('should switch conversations correctly', () => {
    const store = useChatStore.getState();
    const convId = store.conversations[0]?.id;

    store.setCurrentConversationId(convId);

    expect(store.currentConversationId).toBe(convId);
    expect(Array.isArray(store.messages)).toBe(true);
  });
});
```

#### Database Tests (`lib/supabase-chat.test.ts`)

```typescript
describe('Supabase Chat Operations', () => {
  it('should create and fetch conversation', async () => {
    const conv = await createConversation({
      id: 'test-conv',
      title: 'Test',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    expect(conv).toBeTruthy();
    expect(conv?.id).toBe('test-conv');

    const conversations = await fetchConversations();
    expect(conversations.find(c => c.id === 'test-conv')).toBeTruthy();
  });

  it('should cascade delete messages when conversation deleted', async () => {
    const conv = await createConversation({ /* ... */ });
    await createMessage(conv.id, { /* ... */ });

    await deleteConversation(conv.id);

    const messages = await fetchMessages(conv.id);
    expect(messages.length).toBe(0);
  });
});
```

### Integration Tests

#### Conversation Flow Test

```typescript
describe('Conversation Flow', () => {
  it('should create conversation, add messages, and switch', async () => {
    // 1. Start with no conversation
    const { getByText, getByRole } = render(<ChatLayout />);

    // 2. Click "New Chat"
    fireEvent.click(getByText('Neuer Chat'));

    // 3. Send first message
    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(getByText('Send'));

    // 4. Wait for conversation to appear in sidebar
    await waitFor(() => {
      expect(getByText(/Hello/)).toBeInTheDocument();
    });

    // 5. Create second conversation
    fireEvent.click(getByText('Neuer Chat'));

    // 6. Verify first conversation persisted
    fireEvent.click(getByText(/Hello/));
    expect(getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright/Cypress)

```typescript
test('Multi-conversation workflow', async ({ page }) => {
  await page.goto('/chat');

  // Create first conversation
  await page.click('[data-testid="new-chat-button"]');
  await page.fill('[data-testid="message-input"]', 'First conversation');
  await page.click('[data-testid="send-button"]');

  await page.waitForSelector('text=/First conversation/');

  // Create second conversation
  await page.click('[data-testid="new-chat-button"]');
  await page.fill('[data-testid="message-input"]', 'Second conversation');
  await page.click('[data-testid="send-button"]');

  // Verify sidebar shows both
  expect(await page.locator('[data-testid="conversation-item"]').count()).toBe(2);

  // Switch back to first
  await page.click('text=/First conversation/');
  expect(await page.locator('text=/First conversation/')).toBeVisible();
});
```

### Manual Testing Checklist

**Conversation Creation**:
- [ ] Create new conversation with "New Chat" button
- [ ] First message creates conversation automatically
- [ ] Conversation title auto-generated from first message
- [ ] Conversation appears in sidebar immediately

**Conversation Switching**:
- [ ] Click conversation in sidebar loads messages
- [ ] Active conversation highlighted in sidebar
- [ ] Messages persist when switching between conversations
- [ ] URL parameter loading works (`?convId=xxx`)

**Conversation Management**:
- [ ] Rename conversation
- [ ] Delete conversation (confirms deletion)
- [ ] Duplicate conversation
- [ ] Pin conversation to top

**Message Features**:
- [ ] Send text message
- [ ] Send message with image attachment
- [ ] Generate image (appears in current conversation)
- [ ] Generate video (appears in current conversation)
- [ ] Reply to message
- [ ] Super Chat (C1) mode works

**Persistence**:
- [ ] Conversations persist after page refresh
- [ ] Active conversation restores after refresh
- [ ] Messages in all conversations persist
- [ ] Library items link back to correct conversation

**Search**:
- [ ] CMD/CTRL + K opens search
- [ ] Search finds messages across all conversations
- [ ] Clicking result navigates to conversation
- [ ] Search highlights message

**Edge Cases**:
- [ ] Empty conversation list shows welcome message
- [ ] Deleting active conversation resets to empty state
- [ ] Offline mode shows appropriate error
- [ ] Database errors don't crash UI

---

## Security Considerations

### Current Security

1. **Row Level Security (RLS)**: Enabled but permissive
2. **User Isolation**: Via user_id in queries
3. **SQL Injection**: Protected by Supabase parameterized queries
4. **XSS**: React escapes content by default

### Recommended Enhancements

#### 1. Implement Proper RLS Policies

```sql
-- Restrict conversations to owner
CREATE POLICY "Users can only access own conversations"
  ON conversations FOR ALL
  USING (user_id = auth.uid()::text);

-- Restrict messages to conversation owner
CREATE POLICY "Users can only access messages in their conversations"
  ON messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()::text
    )
  );
```

#### 2. Migrate to Supabase Auth

Replace localStorage-based user_id:

```typescript
// lib/supabase/auth.ts
import { supabase } from '../supabase';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
```

#### 3. Rate Limiting

Implement rate limiting for message creation:

```typescript
// lib/rate-limit.ts
const rateLimitMap = new Map();

export function checkRateLimit(userId: string, limit: number = 10): boolean {
  const now = Date.now();
  const userLimits = rateLimitMap.get(userId) || [];

  // Remove old entries (older than 1 minute)
  const recentLimits = userLimits.filter((time: number) => now - time < 60000);

  if (recentLimits.length >= limit) {
    return false; // Rate limit exceeded
  }

  recentLimits.push(now);
  rateLimitMap.set(userId, recentLimits);
  return true;
}
```

#### 4. Input Validation

```typescript
// lib/validation.ts
export function validateMessage(message: Partial<Message>): string[] {
  const errors: string[] = [];

  if (!message.content || message.content.trim() === '') {
    errors.push('Message content is required');
  }

  if (message.content && message.content.length > 10000) {
    errors.push('Message content exceeds maximum length');
  }

  if (message.attachments && message.attachments.length > 10) {
    errors.push('Too many attachments');
  }

  return errors;
}
```

#### 5. CORS Configuration

Ensure Supabase project has correct CORS settings:

```
Allowed Origins: https://your-domain.com
Allowed Methods: GET, POST, PUT, DELETE
Allowed Headers: authorization, x-client-info, apikey, content-type
```

---

## Troubleshooting Guide

### Common Issues

#### 1. Conversations Not Loading

**Symptoms**: Sidebar empty, console shows "Failed to hydrate"

**Solutions**:
- Check Supabase connection: `lib/supabase.ts` has correct URL/API key
- Verify user_id exists: `localStorage.getItem('payperwork_user_id')`
- Check database: Conversations exist for this user_id
- Inspect network tab: Look for 401/403 errors

#### 2. Messages Not Persisting

**Symptoms**: Messages disappear after refresh

**Solutions**:
- Check if using correct store: Should be `chatStore.supabase.ts`
- Verify `addMessage` is awaited: `await store.addMessage(...)`
- Check database: Messages table has entries
- Inspect console: Look for "Failed to sync message" errors

#### 3. Conversation Switching Slow

**Symptoms**: Delay when clicking conversation in sidebar

**Solutions**:
- Messages are loaded in `fetchConversations` - consider lazy loading
- Add loading spinner during switch
- Implement message pagination (see Performance section)

#### 4. Title Not Auto-Generating

**Symptoms**: Conversations stuck with "Neuer Chat" title

**Solutions**:
- Check API route: `/api/generate-chat-title` working
- Verify first user message exists: `messages.find(m => m.role === 'user')`
- Check API key: OpenAI API key configured
- Inspect network: Look for 500 errors

#### 5. Duplicate Conversations Created

**Symptoms**: Multiple conversations with same first message

**Solutions**:
- Check `conversationCreatedRef`: Should prevent duplicates
- Verify conversation created BEFORE first message
- Add deduplication logic in `addConversation`

### Debug Mode

Add debug logging:

```typescript
// In store/chatStore.supabase.ts
const DEBUG = process.env.NODE_ENV === 'development';

function log(...args: any[]) {
  if (DEBUG) console.log('[ChatStore]', ...args);
}

// Usage
log('Adding message:', message.id);
log('Current conversation:', get().currentConversationId);
```

### Health Check Endpoint

Create API route to verify system health:

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('count')
      .limit(1);

    if (error) throw error;

    return Response.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    }, { status: 500 });
  }
}
```

---

## Conclusion

The Payperwork chat application has a robust, production-ready multi-conversation system with:

- Scalable PostgreSQL database with proper indexing
- Optimistic UI updates for fast perceived performance
- Type-safe TypeScript implementation
- Clean separation of concerns (data/state/UI)
- Comprehensive error handling

**Next Steps**:
1. Implement suggested performance optimizations (pagination, virtual scrolling)
2. Migrate to Supabase Auth for production security
3. Add comprehensive test coverage
4. Implement advanced features (conversation export, search improvements)
5. Monitor performance and scale database as needed

For questions or issues, refer to this document and the inline code comments.
