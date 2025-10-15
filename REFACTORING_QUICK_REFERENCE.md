# REFACTORING QUICK REFERENCE
## Critical Points to Remember - Zero Functionality Loss

**Generated:** 2025-10-15
**See Full Details:** `COMPLETE_FUNCTIONALITY_MAPPING.md`

---

## CRITICAL DON'T BREAK LIST

### 1. CHAT SYSTEM - CRITICAL FLOWS

**Conversation Creation:**
- MUST create conversation BEFORE first message (not after)
- Location: `ChatArea.tsx` lines 283-289
- Creates ID, calls addConversation(), THEN adds user message

**Streaming:**
- MUST use skipSync=true during streaming
- Location: `chatStore.supabase.ts` lines 218-243
- Only final message syncs to Supabase

**Title Generation:**
- MUST happen AFTER streaming completes (not during)
- Location: `ChatLayout.tsx` lines 110-165
- Uses prevIsGeneratingRef to detect completion

**SuperChat (C1):**
- MUST use dynamic import (not static)
- Location: `C1Renderer.tsx` lines 33-63
- Prevents build errors with missing dependencies

### 2. VIDEO GENERATION - CRITICAL FLOWS

**Queue Management:**
1. Create temp task ID
2. Add to queue with temp ID (BEFORE API call)
3. Call API
4. Update queue with real task ID (CRITICAL - enables polling)
5. Poll every 5 seconds
6. On complete, update message + add to library

**Location:** `useVideoGeneration.ts` lines 142-326

**Don't Skip:**
- Adding to queue BEFORE API call (lines 144-156)
- Updating task ID (lines 246-267)
- Marking immediate completions (fal.ai) (lines 270-314)

### 3. IMAGE GENERATION - CRITICAL FLOWS

**Retry Logic:**
- Frontend: 2 retries with exponential backoff (2s, 4s)
- API: 4 retries (total 15 attempts max)
- Location: `useImageGeneration.ts` lines 99-276

**Upload Flow:**
- Generate base64 from API
- Upload to Supabase for permanent URL
- Update message with URL (not base64)
- Add to library with metadata

### 4. STATE MANAGEMENT - CRITICAL PATTERNS

**Optimistic UI:**
- Update UI immediately
- Sync to Supabase in background
- Don't revert on failure (retry next action)

**Hydration:**
- Runs ONCE per app session
- Global flags prevent multiple calls
- Location: `chatStore.supabase.ts` lines 61-132

**Conversation Switching:**
- Loads messages from in-memory conversation.messages
- NOT from Supabase (already loaded)
- Location: `chatStore.supabase.ts` lines 362-396

### 5. SKETCH-TO-RENDER - CRITICAL FLOWS

**Auto-naming:**
- Format: `payperwork-sketchtorender-YYYYMMDD-HHMMSS-XXXX`
- Applied to ALL generations (render, edit, upscale, video)
- Location: `page.tsx` lines 193-200

**Source Image Preservation:**
- Keep original for editing
- Store for lightbox before/after
- Location: `page.tsx` lines 207-210

**Database Integration:**
- Save EVERY generation to Supabase
- Include source_image for lightbox
- Location: `page.tsx` lines 84-135

### 6. LIBRARY - CRITICAL FLOWS

**Pagination:**
- Load 20 items at a time
- In-memory filtering (no API on filter change)
- Location: `libraryStore.v2.ts`

**Unseen Tracking:**
- Count on load
- Mark as seen on lightbox open
- Update badge counts
- Location: `LibraryLayout.tsx`

---

## MUST TEST AFTER REFACTORING

### Critical Flows:
1. [ ] Create new conversation (auto-creates before first message)
2. [ ] Send message (streaming works with skipSync)
3. [ ] Title generation (after streaming completes)
4. [ ] SuperChat toggle (C1Renderer loads)
5. [ ] Image generation (retry logic + Supabase upload)
6. [ ] Video generation (temp ID → real ID → polling)
7. [ ] Edit message (removes all after, resends)
8. [ ] Reply to message (context preserved)
9. [ ] Switch conversation (loads from in-memory)
10. [ ] Page reload (conversation restored from localStorage)
11. [ ] Sketch-to-render (auto-naming + database save)
12. [ ] Upscale (polling with 5s intervals)
13. [ ] Library pagination (20 items, infinite scroll)
14. [ ] Selection mode (bulk delete/download)

### Edge Cases:
1. [ ] Switch conversation during streaming (aborts)
2. [ ] Close browser during video generation (queue lost)
3. [ ] Network disconnection (shows warning)
4. [ ] Multiple videos generating (queue manages all)
5. [ ] Freepik upscale failure (empty array bug)
6. [ ] Image generation with 0 credits (no retry)

---

## FILE DEPENDENCIES MAP

### Core Files (Don't Delete):
```
ChatLayout.tsx → Orchestrates entire chat system
ChatArea.tsx → Main chat logic (547 lines)
chatStore.supabase.ts → State management with Supabase sync
useVideoGeneration.ts → Video generation logic
useImageGeneration.ts → Image generation with retry
useVideoQueue.ts → Queue management + polling
C1Renderer.tsx → SuperChat dynamic loading
```

### Key Configuration:
```
/config/chatArea.ts → Constants, defaults, endpoints
/types/chat.ts → Type definitions
/lib/supabase-chat.ts → Supabase operations
/lib/supabase-library.ts → Library operations
```

---

## COMMON PITFALLS TO AVOID

### 1. Breaking Streaming
**Problem:** Updating Supabase on every streaming chunk
**Solution:** Use skipSync=true during streaming
**Location:** `updateMessage(id, content, skipSync=true)`

### 2. Breaking Video Queue
**Problem:** Skipping temp→real task ID update
**Solution:** ALWAYS call updateQueueTaskId() after API returns
**Location:** `useVideoGeneration.ts` lines 246-267

### 3. Breaking Conversation Creation
**Problem:** Creating conversation AFTER first message
**Solution:** Create conversation BEFORE first message
**Location:** `ChatArea.tsx` lines 283-289

### 4. Breaking Title Generation
**Problem:** Generating title during streaming
**Solution:** Wait for isGenerating to become false
**Location:** `ChatLayout.tsx` lines 110-165

### 5. Breaking C1 Loading
**Problem:** Static import of @thesysai/genui-sdk
**Solution:** Dynamic import in useEffect
**Location:** `C1Renderer.tsx` lines 33-63

### 6. Breaking Hydration
**Problem:** Calling hydrate() multiple times
**Solution:** Use global flags to prevent duplicates
**Location:** `chatStore.supabase.ts` lines 61-64

### 7. Breaking Image Retry
**Problem:** Not checking retryable flag
**Solution:** Check error.retryable before retrying
**Location:** `useImageGeneration.ts` lines 254-258

### 8. Breaking Library Pagination
**Problem:** Fetching from API on filter change
**Solution:** Filter in-memory after initial load
**Location:** `libraryStore.v2.ts` getFilteredItems()

---

## EXTERNAL API DEPENDENCIES

### Required API Keys:
- OPENAI_API_KEY - Chat, enhancement, title generation
- THESYS_API_KEY - SuperChat (C1)
- NANOBANANA_API_KEY - Image generation
- KLING_API_KEY - Video generation (Move v1)
- FAL_API_KEY - Video generation (Move v2)
- RUNWAY_API_KEY - Workflow video generation
- FREEPIK_API_KEY - Image upscaling
- NEXT_PUBLIC_SUPABASE_URL - Database + storage
- NEXT_PUBLIC_SUPABASE_ANON_KEY - Client access
- SUPABASE_SERVICE_ROLE_KEY - Server access

### API Patterns:
- **Streaming:** `/api/chat`, `/api/chat-c1` (SSE)
- **Task-based:** `/api/generate-video`, `/api/sketch-to-render/upscale` (POST create, GET poll)
- **Retry:** `/api/generate-image` (exponential backoff)
- **Rate-limited:** All chat APIs (IP-based)

---

## COMPONENT HIERARCHY (SIMPLIFIED)

```
App
├── ChatLayout
│   ├── ChatSidebar (conversations, workflows, library link)
│   └── ChatArea
│       ├── ChatHeader (title, model, superchat toggle)
│       ├── ChatMessages
│       │   └── MessageBubble
│       │       ├── MessageContent (ReactMarkdown or C1Renderer)
│       │       ├── MessageAttachments (images, videos, PDFs)
│       │       └── MessageActions (copy, edit, reply)
│       └── ChatInput
│           ├── InputToolbar (mode, attachments)
│           ├── AttachmentGrid (preview)
│           ├── InputActions (send, record, enhance)
│           └── Settings Slots (image/video)
├── LibraryLayout
│   ├── LibraryHeader (tabs, search, sort)
│   ├── MediaGrid (cards with infinite scroll)
│   └── MediaLightbox (full-screen viewer)
└── SketchToRenderPage
    ├── InputsPanel (upload source/reference)
    ├── RenderPromptInput (prompt + enhance)
    ├── ResultPanel (result + actions)
    └── RecentGenerations (history grid)
```

---

## STATE FLOW (SIMPLIFIED)

### Message Flow:
```
User Input
  → ChatInput
  → ChatArea.handleSendMessage()
  → useChatStore.addMessage() (optimistic UI)
  → Supabase sync (background)
  → ChatMessages (re-render)
```

### Video Flow:
```
User Input
  → ChatArea.handleSendMessage()
  → useVideoGeneration.handleVideoGeneration()
  → useVideoQueue.addToQueue() (temp ID)
  → /api/generate-video (get real task ID)
  → useVideoQueue.updateQueueTaskId() (CRITICAL)
  → useVideoQueue polling (every 5s)
  → useVideoQueue.onVideoReady()
  → useChatStore.updateMessageWithAttachments()
  → useLibraryStore.addItem()
```

### Conversation Switch:
```
User Click
  → ChatSidebar.ConversationItem
  → ChatLayout.handleLoadConversation()
  → useChatStore.setCurrentConversationId()
  → Load messages from conversation.messages (in-memory, NO API)
  → ChatMessages (re-render)
```

---

## PERFORMANCE NOTES

### Optimizations in Place:
1. ChatMessages memoization (custom comparison)
2. Video cache (15-minute TTL)
3. Library pagination (20 items)
4. In-memory filtering (no API calls)
5. Optimistic UI (instant updates)
6. Streaming batch updates (50ms intervals)
7. C1Component dynamic import (smaller bundle)
8. Image compression before upload (max 1920px)

### Don't Remove These:
- React.memo on ChatMessages
- videoCache.set()/get() calls
- getFilteredItems() in-memory logic
- skipSync flag in updateMessage()
- createUpdateScheduler batching
- Dynamic import in C1Renderer
- Image compression in useUpscale

---

## QUICK DEBUGGING TIPS

### Streaming Not Working:
- Check: AbortController cleanup
- Check: skipSync flag during streaming
- Check: SSE format `data: {"content": "..."}\n\n`

### Video Not Polling:
- Check: updateQueueTaskId() called after API
- Check: taskId not starting with "temp-"
- Check: pollInterval running (useVideoQueue)

### Messages Not Loading:
- Check: Hydration completed (isHydrated = true)
- Check: setCurrentConversationId() called
- Check: conversation.messages exists

### Library Not Showing:
- Check: loadItems() called on mount
- Check: Supabase credentials valid
- Check: filters applied correctly

### C1 Not Loading:
- Check: @thesysai/genui-sdk installed
- Check: Dynamic import syntax correct
- Check: Error boundary catching issues

---

## WHEN IN DOUBT

1. Read the relevant section in `COMPLETE_FUNCTIONALITY_MAPPING.md`
2. Check the actual code in the file
3. Test the existing flow BEFORE changing
4. Make small changes, test frequently
5. Use git branches for experiments
6. Keep this checklist handy

---

**Remember:** This application has been carefully architected with specific patterns for streaming, polling, and state management. Every pattern exists for a reason. Don't "simplify" without understanding WHY it's complex.

**Last Updated:** 2025-10-15
