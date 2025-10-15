# Conversation Hooks - Quick Reference

## useConversations

Fetch and filter conversations.

```typescript
const {
  conversations,           // All conversations
  filteredConversations,   // Filtered results
  currentConversation,     // Active conversation
  isLoading,              // Loading state
  error,                  // Error state
  refresh,                // Reload from DB
  isActive                // Check if conversation is active
} = useConversations({
  autoFetch: true,        // Auto-load on mount
  pinnedOnly: false,      // Show only pinned
  searchQuery: '',        // Search query
  sortBy: 'updated_at',   // Sort field
  sortDirection: 'desc'   // Sort direction
});
```

## useConversationActions

CRUD operations for conversations.

```typescript
const {
  createConversation,     // Create new conversation
  updateConversation,     // Update conversation
  deleteConversation,     // Delete conversation
  duplicateConversation,  // Duplicate conversation
  togglePin,              // Toggle pin status
  renameConversation,     // Rename conversation
  bulkDelete,             // Delete multiple
  exportConversation,     // Export as JSON
  isLoading,              // Loading state
  error,                  // Error state
  clearError              // Clear error
} = useConversationActions();

// Examples
await createConversation('My Chat');
await togglePin(convId);
await renameConversation(convId, 'New Title');
const json = await exportConversation(convId);
```

## useConversationSwitch

Switch between conversations.

```typescript
const {
  switchTo,               // Switch to conversation
  goToNext,              // Go to next conversation
  goToPrevious,          // Go to previous conversation
  createAndSwitch,       // Create and switch to new
  isSwitching            // Loading state
} = useConversationSwitch({
  autoSave: true,                 // Save before switching
  enableKeyboardShortcuts: true   // Enable keyboard shortcuts
});

// Keyboard shortcuts (when enabled):
// - Cmd/Ctrl + ] = Next conversation
// - Cmd/Ctrl + [ = Previous conversation
// - Cmd/Ctrl + N = New conversation
// - Cmd/Ctrl + 1-9 = Switch to conversation by index
```

## useConversationTitle

Manage conversation titles.

```typescript
const {
  generateTitle,          // Generate from first message
  regenerateTitle,        // Regenerate title
  updateTitle,            // Update manually
  validateTitle,          // Validate title
  isGenerating,          // Loading state
  error                  // Error state
} = useConversationTitle();

// Examples
const title = await generateTitle(convId);
await updateTitle(convId, 'New Title');

const validation = validateTitle('My Title');
if (!validation.valid) {
  console.error(validation.error);
}
```

## Utility Functions

### Title Generator

```typescript
import {
  generateLocalTitle,
  generateAITitle,
  validateTitle,
  formatTitleForDisplay,
  sanitizeTitle
} from '@/lib/conversations';

// Generate title locally (fast)
const title = generateLocalTitle('Hello, how are you?');
// => "Hello, how are you?"

// Generate with AI (slow, more intelligent)
const aiTitle = await generateAITitle('What is React?');
// => "React Framework Discussion"

// Validate
const validation = validateTitle('My Title');
// => { valid: true }

// Format for display
const short = formatTitleForDisplay('Very Long Title...', 20);
// => "Very Long Title..."

// Sanitize
const clean = sanitizeTitle('Title!!@@##');
// => "Title"
```

### Conversation Sorter

```typescript
import {
  sortConversations,
  filterConversations,
  groupConversationsByDate,
  getConversationStats,
  findConversations
} from '@/lib/conversations';

// Sort
const sorted = sortConversations(conversations, 'updated_at', 'desc');

// Filter by search
const filtered = filterConversations(conversations, 'react');

// Group by date
const groups = groupConversationsByDate(conversations);
// => [
//   { label: 'Heute', conversations: [...] },
//   { label: 'Gestern', conversations: [...] },
//   ...
// ]

// Get statistics
const stats = getConversationStats(conversations);
// => {
//   totalConversations: 42,
//   totalMessages: 1337,
//   averageMessagesPerConversation: 31.8,
//   pinnedConversations: 5,
//   conversationsWithImages: 12,
//   conversationsWithVideos: 3,
//   conversationsWithC1: 8
// }

// Find conversations with criteria
const videoConvs = findConversations(conversations, {
  hasVideos: true,
  minMessages: 5
});
```

## Common Patterns

### Pattern: Search & Filter

```typescript
function ConversationSidebar() {
  const [searchQuery, setSearchQuery] = useState('');

  const { filteredConversations } = useConversations({
    searchQuery,
    sortBy: 'updated_at'
  });

  return (
    <div>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Suchen..."
      />
      {filteredConversations.map(conv => (
        <ConversationCard key={conv.id} conversation={conv} />
      ))}
    </div>
  );
}
```

### Pattern: Create & Switch

```typescript
function NewChatButton() {
  const { createAndSwitch, isSwitching } = useConversationSwitch();

  return (
    <button onClick={createAndSwitch} disabled={isSwitching}>
      Neuer Chat
    </button>
  );
}
```

### Pattern: Pin Toggle

```typescript
function ConversationMenu({ conversationId }: { conversationId: string }) {
  const { togglePin, isLoading } = useConversationActions();

  return (
    <button
      onClick={() => togglePin(conversationId)}
      disabled={isLoading}
    >
      {isLoading ? 'Wird gespeichert...' : 'Pin'}
    </button>
  );
}
```

### Pattern: Export Conversation

```typescript
function ExportButton({ conversationId }: { conversationId: string }) {
  const { exportConversation } = useConversationActions();

  const handleExport = async () => {
    const json = await exportConversation(conversationId);

    // Download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversationId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleExport}>
      Als JSON exportieren
    </button>
  );
}
```

### Pattern: Auto-save Before Navigation

```typescript
function ConversationList() {
  const { conversations } = useConversations();
  const { switchTo } = useConversationSwitch({
    autoSave: true // Automatically saves current conversation before switching
  });

  return (
    <div>
      {conversations.map(conv => (
        <button
          key={conv.id}
          onClick={() => switchTo(conv.id)}
        >
          {conv.title}
        </button>
      ))}
    </div>
  );
}
```

### Pattern: Keyboard Shortcuts

```typescript
function App() {
  const { switchTo, goToNext, goToPrevious } = useConversationSwitch({
    enableKeyboardShortcuts: true
  });

  // Now users can use:
  // - Cmd/Ctrl + ] to go to next conversation
  // - Cmd/Ctrl + [ to go to previous conversation
  // - Cmd/Ctrl + N to create new conversation
  // - Cmd/Ctrl + 1-9 to switch to conversation by index

  return <div>Your app content...</div>;
}
```

## TypeScript Types

```typescript
import type {
  Conversation,
  Message,
  ChatError
} from '@/types/chat';

import type {
  UseConversationsOptions,
  UseConversationsReturn,
  UseConversationActionsReturn,
  UseConversationSwitchOptions,
  UseConversationSwitchReturn,
  UseConversationTitleReturn
} from '@/hooks/conversations';

import type {
  SortBy,
  SortDirection,
  ConversationGroup,
  ConversationStats,
  ConversationSearchCriteria
} from '@/lib/conversations';
```

## Best Practices

1. **Use hooks at component level, not in loops**
   ```typescript
   // ✅ Good
   function MyComponent() {
     const { conversations } = useConversations();
     return conversations.map(conv => <Item key={conv.id} />);
   }

   // ❌ Bad
   function MyComponent() {
     return conversations.map(conv => {
       const { togglePin } = useConversationActions(); // DON'T DO THIS
       return <Item key={conv.id} />;
     });
   }
   ```

2. **Handle loading states**
   ```typescript
   const { conversations, isLoading } = useConversations();

   if (isLoading) return <Spinner />;
   return <List items={conversations} />;
   ```

3. **Handle errors gracefully**
   ```typescript
   const { error, clearError } = useConversationActions();

   if (error) {
     return (
       <div>
         <p>{error}</p>
         <button onClick={clearError}>Dismiss</button>
       </div>
     );
   }
   ```

4. **Use optimistic updates** (already handled by hooks)
   - UI updates immediately
   - Database sync happens in background
   - No loading spinners for most actions

5. **Combine hooks for complex features**
   ```typescript
   function ComplexFeature() {
     const { conversations } = useConversations();
     const { deleteConversation } = useConversationActions();
     const { switchTo } = useConversationSwitch();

     // Use multiple hooks together
   }
   ```

## Troubleshooting

### Hook returns empty array

Check if store is hydrated:
```typescript
const { isHydrated } = useChatStore();
const { conversations } = useConversations();

if (!isHydrated) return <Loading />;
```

### "Cannot read property of undefined"

Store not initialized. Wait for hydration:
```typescript
const { conversations, isLoading } = useConversations({ autoFetch: true });

if (isLoading) return <Loading />;
```

### Keyboard shortcuts not working

Enable in hook options:
```typescript
useConversationSwitch({
  enableKeyboardShortcuts: true // Add this
});
```

### Actions feel slow

They're async. Add optimistic UI:
```typescript
const { deleteConversation, isLoading } = useConversationActions();

// UI updates immediately (optimistic)
// Database sync happens in background
```
