# COMPLETE FUNCTIONALITY MAPPING
## Payperwork Next.js Application - Zero Functionality Loss Reference

**Generated:** 2025-10-15
**Purpose:** Complete inventory of ALL features, flows, and dependencies to ensure zero functionality loss during refactoring.

---

## TABLE OF CONTENTS
1. [Feature Inventory](#1-feature-inventory)
2. [Critical User Flows](#2-critical-user-flows)
3. [State Management Map](#3-state-management-map)
4. [External Integrations](#4-external-integrations)
5. [Critical Dependencies](#5-critical-dependencies)
6. [Custom Hooks Inventory](#6-custom-hooks-inventory)
7. [Component Architecture](#7-component-architecture)
8. [API Endpoints](#8-api-endpoints)

---

## 1. FEATURE INVENTORY

### 1.1 CHAT SYSTEM (Main Application)

#### 1.1.1 Chat Modes
**Primary File:** `/app/chat/page.tsx` → `/components/chat/ChatLayout.tsx` → `/components/chat/Chat/ChatArea.tsx`

**Features:**
- **Standard Chat Mode** - OpenAI GPT-4o/GPT-5 text conversations
  - Files: `ChatArea.tsx` (lines 352-425), `/app/api/chat/route.ts`
  - State: `mode = "chat"`, `selectedGPTModel = "gpt-4o" | "gpt-5"`
  - API: `/api/chat` with streaming response
  - Functions: `handleSendMessage()`, streaming with SSE

- **SuperChat Mode (C1)** - Thesys C1 API with Claude Sonnet 4 for interactive UI
  - Files: `ChatArea.tsx` (lines 436-443), `/app/api/chat-c1/route.ts`, `C1Renderer.tsx`
  - State: `isSuperChatEnabled = true/false` (per-conversation toggle)
  - API: `/api/chat-c1` with C1 streaming
  - Component: `C1Renderer` with dynamic import of `@thesysai/genui-sdk`
  - Special: Supports related queries and interactive actions

- **Image Generation Mode** - Nano Banana API (Gemini Pro Vision)
  - Files: `ChatArea.tsx` (lines 318-327), `useImageGeneration.ts`, `/app/api/generate-image/route.ts`
  - State: `mode = "image"`, `imageSettings` with format/style/lighting/quality
  - API: `/api/generate-image` with retry logic (max 2 frontend retries)
  - Settings: aspect ratio (1:1, 16:9, 9:16, 4:3, 3:2, 21:9), quality, style, lighting
  - Functions: `generateImage()` with exponential backoff, Supabase upload
  - Library Integration: Auto-adds to library with metadata

- **Video Generation Mode** - Unified video API supporting multiple models
  - Files: `ChatArea.tsx` (lines 330-350), `useVideoGeneration.ts`, `/app/api/generate-video/route.ts`
  - State: `mode = "video"`, `videoSettings`, `selectedVideoModel`
  - Models:
    - `payperwork-v1` (Kling AI) - text2video/image2video with camera movement
    - `payperwork-v2` (fal.ai Sora 2) - faster generation, audio support
  - API: `/api/generate-video` with task-based polling
  - Queue: `useVideoQueue` hook manages polling, progress, notifications
  - Settings: duration (5s/10s), aspect ratio (16:9/9:16/1:1), mode (standard/pro), audio
  - Functions: `handleVideoGeneration()`, placeholder rendering, progress tracking
  - Special: Browser notifications when complete, cache for faster re-access

#### 1.1.2 Message Features

**Files:** `ChatMessages.tsx`, `MessageBubble.tsx`, `MessageContent.tsx`, `MessageActions.tsx`

**Features:**
- **Message Display**
  - Standard markdown rendering for text messages (ReactMarkdown)
  - C1 interactive rendering for SuperChat messages (C1Component)
  - Attachments display: images, videos, PDFs
  - Reply references with attachment preview
  - Streaming indicator with cursor animation
  - Video placeholders with progress bars during generation
  - Generation attempt counter for retry visualization

- **Message Actions**
  - Copy to clipboard (with success indicator)
  - Edit message (regenerates from that point)
  - Reply to message (with context)
  - Download attachments (images/videos)
  - C1 Related Queries (populates input without auto-sending)

- **Message Edit Flow**
  - Files: `ChatArea.tsx` (lines 445-461), `useMessageActions.ts`
  - Function: `handleEditMessage()`
  - Behavior: Removes all messages after edited one, resends with new content
  - Preserves: Original attachments

#### 1.1.3 Input System

**Files:** `ChatInput.tsx`, `InputToolbar.tsx`, `InputActions.tsx`, `AttachmentGrid.tsx`

**Features:**
- **Text Input**
  - Multi-line textarea with auto-resize (max 200px height)
  - Enter to send, Shift+Enter for new line
  - Placeholder text based on mode
  - Controlled/uncontrolled mode support (value/onValueChange props)

- **File Attachments**
  - Hook: `useFileUpload.ts`
  - Upload: Multiple images, PDFs, videos
  - Preview: Grid layout with thumbnails
  - Edit: Image cropping with modal (`ImageCropModal`)
  - Remove: Individual attachment removal
  - Drag & Drop: Full drag-and-drop support with overlay
  - Base64: Converts to base64 for API transmission

- **Voice Recording**
  - Hook: `useVoiceRecording.ts`
  - API: `/api/transcribe` (Whisper)
  - Button: Microphone icon, recording indicator
  - Transcription: Auto-fills input after complete
  - State: `isRecording`, `isTranscribing`

- **Prompt Enhancement**
  - Hook: `usePromptEnhancement.ts`
  - API: `/api/enhance-prompt`
  - Button: Sparkles icon, enhancement indicator
  - Context: Includes mode, attachments, reply context, settings
  - Behavior: Enhances prompt in-place, maintains user control

- **Reply System**
  - Hook: `useReplyMessage.ts`
  - Display: Reply preview bar with cancel button
  - Context: Includes reply message ID and content (not attachments to save space)
  - Behavior: Sends reply context to API, clears after send
  - Special: Can reply with specific attachment (e.g., image editing)

- **Mode Selection**
  - Dropdown: Chat/Image/Video mode toggle
  - Position: Left of input textarea
  - Settings: Mode-specific settings panels (image/video)
  - SuperChat Indicator: Shows when SuperChat is enabled

#### 1.1.4 Conversation Management

**Files:** `ChatLayout.tsx`, `ChatSidebar.tsx`, `ConversationList.tsx`, `ConversationItem.tsx`

**Features:**
- **Conversation CRUD**
  - Create: Auto-creates on first message, generates title after completion
  - Read: Load conversation from Supabase, restore on page reload
  - Update: Save messages on each message, update title/settings
  - Delete: Remove conversation and all messages
  - Duplicate: Copy conversation with all messages
  - Rename: Edit conversation title

- **Conversation List**
  - Display: Sorted by updatedAt (newest first)
  - Active: Highlight current conversation (only on /chat page)
  - Search: Global search with CMD+K/CTRL+K shortcut
  - Actions: Context menu with edit/duplicate/delete

- **Title Generation**
  - API: `/api/generate-chat-title`
  - Trigger: After first message exchange completes (not during streaming)
  - Fallback: First 50 chars of user message
  - Update: Updates conversation title in Supabase

- **SuperChat Toggle**
  - Per-conversation setting stored in Supabase
  - Toggle in ChatHeader
  - Affects: Which API endpoint is called (/api/chat vs /api/chat-c1)
  - Rendering: Standard markdown vs C1 interactive UI

#### 1.1.5 Chat Header Features

**Files:** `ChatHeader.tsx`

**Features:**
- Chat name display with inline edit
- Model selection dropdowns:
  - GPT Model: gpt-4o (fast) / gpt-5 (advanced)
  - Video Model: Move v1 (Kling) / Move v2 (Sora 2)
- SuperChat toggle switch
- Mobile menu button

---

### 1.2 SKETCH-TO-RENDER WORKFLOW

**Primary File:** `/app/workflows/sketch-to-render/page.tsx` (966 lines)

#### 1.2.1 Core Workflow Features

**Features:**
- **Sketch-to-Render Generation**
  - Hook: `useSketchToRender.ts`
  - API: `/api/sketch-to-render`
  - Model: Nano Banana (Gemini Pro Vision)
  - Input: Source image (required) + prompt + reference images (optional)
  - Settings: RenderSettings (aspect ratio, style, quality, lighting)
  - Output: Photorealistic rendering
  - Progress: 0% → 10% → 20% → 60% → 80% → 100%
  - Auto-naming: `payperwork-sketchtorender-YYYYMMDD-HHMMSS-XXXX`

- **Prompt Enhancement**
  - Hook: `usePromptEnhancer.ts` (workflows version)
  - API: `/api/sketch-to-render/enhance-prompt`
  - Context: Includes source image, reference images, settings
  - Enhancement: OpenAI GPT-4o enhances prompt for better results

- **Image Editing**
  - Hook: `useRenderEdit.ts`
  - API: Same as generation but with edit context
  - Input: Previous result image + edit prompt
  - Output: Edited version with new auto-generated name
  - Metadata: Links to previous image, tracks "from_render" source type

- **Upscaling**
  - Hook: `useUpscale.ts`
  - API: `/api/sketch-to-render/upscale`
  - Provider: Freepik Magnific AI
  - Settings: sharpen (0-100), smart_grain (0-100), ultra_detail (0-100)
  - Process: Task-based polling (5-second intervals, max 5 minutes)
  - Compression: Auto-compresses to JPEG (0.92 quality, max 1920px width)
  - Output: Upscaled 4K image with new auto-generated name

- **Video Generation** (from renders)
  - API: `/api/generate-runway-video`
  - Provider: Runway Gen-4 Turbo
  - Input: Result image (from render) + optional prompt
  - Duration: 5 or 10 seconds
  - Output: Video file with auto-generated name
  - Integration: Adds to recent generations and library

#### 1.2.2 Workflow State Management

**State Variables:**
```typescript
- prompt: string
- renderSettings: RenderSettingsType
- inputData: { sourceImage, referenceImages }
- resultImage: string | null
- resultMediaType: "image" | "video"
- renderName: string
- originalPrompt: string (for editing)
- recentGenerations: array
- currentSourceImage: string | null (for lightbox)
- isGeneratingVideo: boolean
- cropModalOpen: boolean
- lightboxOpen: boolean
```

#### 1.2.3 Recent Generations

**Features:**
- Display: Grid of recent renders/videos/upscales
- Actions: Edit, Upscale, Generate Video, Download, Delete
- Lightbox: Full-screen view with before/after comparison
- Database: Loads from Supabase on mount, saves on generation
- API: `/api/sketch-to-render/generations` (GET), `/api/sketch-to-render/save-generation` (POST)

#### 1.2.4 Image Cropping

**Features:**
- Modal: `ImageCropModal`
- Trigger: Edit button on source/reference images
- Library: react-easy-crop
- Behavior: Maintains original image for re-cropping
- Output: Updates preview while preserving original

---

### 1.3 LIBRARY SYSTEM

**Primary File:** `/app/library/page.tsx` → `/components/library/LibraryLayout.tsx`

#### 1.3.1 Library Features

**Files:** `LibraryLayout.tsx`, `MediaGrid.tsx`, `MediaCard.tsx`, `MediaLightbox.tsx`

**Features:**
- **Media Display**
  - Types: Images, Videos, All, Favorites
  - View: Grid layout with infinite scroll
  - Tabs: All/Videos/Images/Favorites with counts and unseen badges
  - Search: Real-time search across names, prompts, models
  - Sort: Newest/Oldest/Name

- **Media Card**
  - Thumbnail: Image/video preview
  - Metadata: Name, model, date, dimensions
  - Actions: Download, Delete, Navigate to chat, Toggle favorite
  - Unseen: Badge indicator for new items
  - Selection: Checkbox for bulk actions

- **Selection Mode**
  - Hook: `useLibrarySelection.ts`
  - Toggle: Button in header
  - Actions: Select all, deselect all, bulk delete, bulk download
  - Keyboard: Ctrl+A (select all), Delete (bulk delete), Escape (exit mode)

- **Bulk Actions**
  - Hook: `useBulkActions.ts`
  - Delete: Removes multiple items from Supabase
  - Download: Downloads multiple items as individual files
  - Progress: Shows processing indicator

- **Lightbox**
  - Hook: `useLibraryLightbox.ts`
  - Display: Full-screen media viewer
  - Navigation: Arrow keys, next/prev buttons
  - Actions: Download, delete, navigate to chat
  - Metadata: Full details panel with all info
  - Keyboard: Arrow keys (navigate), Escape (close), D (download), Delete (delete)

#### 1.3.2 Library Store

**File:** `store/libraryStore.v2.ts`

**Features:**
- Supabase integration for persistent storage
- Real-time updates with optimistic UI
- Infinite scroll pagination (20 items per load)
- Filter/search/sort in-memory
- Unseen count tracking by type
- Mark as seen on view

**State:**
```typescript
- items: LibraryItem[]
- filters: { type, searchQuery, sortBy }
- unseenCount: number
- isLoading: boolean
```

**Actions:**
```typescript
- loadItems() - Initial load from Supabase
- loadMoreItems() - Pagination
- addItem() - Add new item
- removeItem() - Delete item
- updateItem() - Update metadata
- markAsSeen() - Mark as viewed
- getFilteredItems() - Apply filters
- getUnseenByType() - Count unseen
- setFilters() - Update filters
```

---

### 1.4 SIDEBAR & NAVIGATION

**Files:** `ChatSidebar.tsx`, `NavigationSection.tsx`, `WorkflowList.tsx`

**Features:**
- **Navigation Links**
  - Library: Shows unseen count badge
  - Workflows: Sketch-to-Render, (future workflows)
  - New Chat: Creates fresh conversation

- **Search**
  - Modal: `SearchModal.tsx`
  - Trigger: Click search or CMD+K/CTRL+K
  - Search: Across all conversations and messages
  - Navigation: Click result to load conversation and scroll to message
  - Highlighting: Temporarily highlights target message

- **Collapse Mode**
  - Toggle: Collapse/expand sidebar
  - Collapsed: Shows only icons
  - Expanded: Shows full interface
  - Persistent: State maintained across navigation

---

## 2. CRITICAL USER FLOWS

### 2.1 STANDARD CHAT FLOW

**Steps:**
1. User lands on `/chat` → `ChatLayout` component loads
2. `ChatLayout` hydrates Zustand store from Supabase (conversations + messages)
3. If URL has `?convId=xxx`, loads that conversation
4. Otherwise, shows welcome screen (`ChatWelcome`)
5. User types message in `ChatInput`
6. User clicks send or presses Enter
7. **Pre-send checks:**
   - If no conversation exists (`currentConversationId === null` && `messages.length === 0`):
     - Creates new conversation ID
     - Calls `addConversation()` to save to Supabase
   - Builds user message with attachments
   - Calls `addMessage()` to add to Zustand + Supabase
8. Creates assistant message placeholder
9. Calls `/api/chat` or `/api/chat-c1` based on SuperChat toggle
10. **Streaming response:**
    - SSE stream with `data: {"content": "..."}\n\n` format
    - Updates assistant message in real-time with `updateMessage(id, content, skipSync=true)`
    - `skipSync` prevents Supabase updates during streaming
11. **Stream complete:**
    - Final `updateMessage()` without `skipSync` saves to Supabase
    - Sets `isGenerating = false`
12. **Post-generation:**
    - If first message, generates chat title via `/api/generate-chat-title`
    - Updates conversation with title in Supabase
    - Conversation appears in sidebar

**State Changes:**
```typescript
Initial: { messages: [], currentConversationId: null, isGenerating: false }
After send: { messages: [userMsg, assistantPlaceholder], currentConversationId: "123", isGenerating: true }
During stream: { messages: [userMsg, assistantStreaming], isGenerating: true }
Complete: { messages: [userMsg, assistantFinal], isGenerating: false }
```

**Components Involved:**
- `ChatLayout.tsx` - Orchestrator
- `ChatArea.tsx` - Main logic
- `ChatInput.tsx` - Input handling
- `ChatMessages.tsx` - Display
- `MessageBubble.tsx` - Individual message rendering
- `C1Renderer.tsx` - SuperChat rendering (if enabled)
- `chatStore.supabase.ts` - State management
- `/app/api/chat/route.ts` or `/app/api/chat-c1/route.ts` - API

**APIs Called:**
- `POST /api/chat` or `POST /api/chat-c1` - Streaming chat
- `POST /api/generate-chat-title` - Title generation (after first exchange)

---

### 2.2 IMAGE GENERATION FLOW

**Steps:**
1. User switches to Image mode (dropdown or direct)
2. User configures `ImageSettings` (aspect ratio, quality, style, lighting)
3. User optionally attaches reference images (for character consistency)
4. User optionally replies to previous image (for editing)
5. User types prompt (or enhances with AI)
6. User clicks send
7. **Pre-send:** Same conversation creation as standard chat
8. Calls `generateImage()` from `useImageGeneration.ts`
9. **Generation process:**
   - Extracts reference images from attachments + reply context
   - Builds API payload with prompt + references + settings
   - Calls `/api/generate-image` with retry logic:
     - Attempt 1: Immediate
     - Attempt 2: Wait 2 seconds
     - Attempt 3: Wait 4 seconds
   - Updates placeholder with attempt counter
10. **Success:**
    - Receives image(s) as base64 from API
    - Uploads to Supabase via `/api/upload-chat-image` for permanent URL
    - Updates assistant message with image attachments
    - Adds to library with metadata (prompt, model, settings)
11. **Failure:**
    - Shows error message in assistant placeholder
    - Retry button if retryable error

**State Changes:**
```typescript
Initial: { mode: "image", imageSettings: {...}, isGenerating: false }
After send: { isGenerating: true, generationAttempt: 1 }
Retry: { isGenerating: true, generationAttempt: 2 }
Success: { isGenerating: false, messages: [..., assistantWithImage] }
```

**Components Involved:**
- `ChatArea.tsx` - Orchestrator
- `ChatInput.tsx` - Input with ImageSettings slot
- `useImageGeneration.ts` - Generation logic
- `ImageSettings.tsx` - Settings panel
- `MessageAttachments.tsx` - Display
- `/app/api/generate-image/route.ts` - API

**APIs Called:**
- `POST /api/generate-image` - Image generation (with retries)
- `POST /api/upload-chat-image` - Supabase upload
- Library store: `addItem()` - Add to library

---

### 2.3 VIDEO GENERATION FLOW

**Steps:**
1. User switches to Video mode
2. User configures `VideoSettings` (model, duration, aspect ratio, camera movement, audio)
3. User optionally attaches image (for image2video)
4. User types prompt (or enhances with AI)
5. User clicks send
6. **Pre-send:** Same conversation creation as standard chat
7. Calls `handleVideoGeneration()` from `useVideoGeneration.ts`
8. **Generation process:**
   - Determines type: text2video or image2video
   - Enhances prompt with camera movement (Kling only)
   - Generates temporary task ID
   - **CRITICAL:** Adds to queue BEFORE API call with temp ID
   - Updates assistant message with placeholder and videoTask metadata
   - Calls `/api/generate-video` with payload
   - Receives real task ID from API
   - **CRITICAL:** Updates queue item with real task ID (enables polling)
   - If fal.ai (v2) returns immediately, marks complete and skips polling
9. **Polling (useVideoQueue):**
   - Polls `/api/generate-video?task_id=xxx&model=xxx&type=xxx` every 5 seconds
   - Updates progress based on elapsed time vs estimated duration
   - Updates message videoTask with progress and ETA
   - Calls `onProgressUpdate` callback
10. **Completion:**
    - Receives video URL from polling
    - Caches video URL for faster re-access
    - Updates assistant message with video attachment
    - Calls `onVideoReady` callback
    - Adds to library with metadata
    - Sends browser notification
    - Shows in-app toast
    - Removes from queue after 30 seconds
11. **Failure:**
    - Updates message with error
    - Calls `onVideoFailed` callback
    - Removes from queue after 5 seconds

**State Changes:**
```typescript
Initial: { mode: "video", videoSettings: {...}, queue: [] }
After send: { isGenerating: true, queue: [{ taskId: "temp-123", status: "processing" }] }
Task ID updated: { queue: [{ taskId: "real-task-id", status: "processing" }] }
Polling: { queue: [{ taskId: "...", status: "processing", progress: 45 }] }
Complete: { isGenerating: false, queue: [{ status: "succeed", videoUrl: "..." }] }
After delay: { queue: [] } // Removed
```

**Components Involved:**
- `ChatArea.tsx` - Orchestrator
- `ChatInput.tsx` - Input with VideoSettings slot
- `useVideoGeneration.ts` - Generation logic
- `useVideoQueue.ts` - Queue and polling
- `VideoSettings.tsx` - Settings panel
- `VideoAttachment.tsx` - Display with placeholder/progress
- `VideoQueuePanel.tsx` - Queue UI (if implemented)
- `/app/api/generate-video/route.ts` - API

**APIs Called:**
- `POST /api/generate-video` - Start generation, returns task ID
- `GET /api/generate-video?task_id=xxx&model=xxx&type=xxx` - Poll status
- Library store: `addItem()` - Add to library

**Critical Timing:**
1. Add to queue with temp ID (immediate UI feedback)
2. Call API (async)
3. Update queue with real task ID (enables polling)
4. Poll every 5 seconds (max 10 consecutive errors before auto-fail)
5. On success, update message and library
6. Remove from queue after visibility delay

---

### 2.4 SKETCH-TO-RENDER FLOW

**Steps:**
1. User navigates to `/workflows/sketch-to-render`
2. **Input Phase:**
   - User uploads source image (required, with crop option)
   - User optionally uploads reference images (with crop option)
   - User types prompt or enhances with AI
   - User configures render settings (aspect ratio, style, quality)
3. User clicks "Generate"
4. **Generation:**
   - Calls `generate()` from `useSketchToRender.ts`
   - Validates inputs (source image + prompt required)
   - Converts images to base64
   - Calls `/api/sketch-to-render` with payload
   - Progress: 0% → 10% → 20% → 60% → 80% → 100%
5. **Success:**
   - Receives rendered image as base64
   - Displays in result panel
   - Auto-generates name: `payperwork-sketchtorender-YYYYMMDD-HHMMSS-XXXX`
   - Adds to recent generations (UI + database)
   - Saves to Supabase via `/api/sketch-to-render/save-generation`
   - Stores original prompt for editing
   - Clears prompt and resets settings for next generation
6. **Next Actions:**
   - User can edit result (provides edit prompt, generates new version)
   - User can upscale result (Freepik Magnific, task-based polling)
   - User can generate video from result (Runway Gen-4 Turbo)
   - User can download result
   - User can view in lightbox with before/after comparison

**State Changes:**
```typescript
Initial: { sourceImage: null, prompt: "", resultImage: null, isGenerating: false }
After upload: { sourceImage: { file, preview }, prompt: "", resultImage: null }
After prompt: { sourceImage: {...}, prompt: "...", resultImage: null }
During generation: { isGenerating: true, progress: 45 }
Complete: { isGenerating: false, progress: 100, resultImage: "data:image/...", renderName: "..." }
After clear: { sourceImage: {...}, prompt: "", resultImage: "...", isGenerating: false }
```

**Components Involved:**
- `/app/workflows/sketch-to-render/page.tsx` - Main page
- `InputsPanel.tsx` - Source/reference upload
- `InputImagesPanel.tsx` - Image preview grid
- `RenderPromptInput.tsx` - Prompt input with enhance
- `ResultPanel.tsx` - Result display with actions
- `RecentGenerations.tsx` - History grid
- `RenderLightbox.tsx` - Full-screen comparison
- `useSketchToRender.ts` - Generation logic
- `useRenderEdit.ts` - Edit logic
- `useUpscale.ts` - Upscale logic
- `usePromptEnhancer.ts` - Prompt enhancement
- `/app/api/sketch-to-render/route.ts` - Generation API

**APIs Called:**
- `POST /api/sketch-to-render` - Generate render
- `POST /api/sketch-to-render/enhance-prompt` - Enhance prompt
- `POST /api/sketch-to-render/upscale` - Create upscale task
- `GET /api/sketch-to-render/upscale?task_id=xxx` - Poll upscale status
- `POST /api/generate-runway-video` - Generate video from render
- `GET /api/sketch-to-render/generations?userId=xxx` - Load history
- `POST /api/sketch-to-render/save-generation` - Save to database

---

### 2.5 LIBRARY FLOW

**Steps:**
1. User navigates to `/library`
2. **Load Phase:**
   - `LibraryLayout` mounts
   - Calls `loadItems()` from `useLibraryStore`
   - Fetches items from Supabase (20 items initially)
   - Displays loading indicator
3. **Display:**
   - Renders `MediaGrid` with filtered items
   - Shows tabs with counts and unseen badges
   - User can filter by type, search, sort
4. **Interaction:**
   - Click item: Opens lightbox
   - Selection mode: Toggle checkboxes for bulk actions
   - Actions: Download, delete, navigate to chat, favorite
5. **Infinite Scroll:**
   - User scrolls to bottom
   - Calls `loadMoreItems()` to fetch next 20
   - Appends to existing items
   - Continues until no more items
6. **Lightbox:**
   - Full-screen view with metadata
   - Navigate with arrow keys or buttons
   - Download, delete, navigate to chat
   - Mark as seen automatically

**State Changes:**
```typescript
Initial: { items: [], isLoading: true, hasMore: true }
After load: { items: [20 items], isLoading: false, hasMore: true }
After scroll: { items: [40 items], isLoading: false, hasMore: true }
End: { items: [all items], isLoading: false, hasMore: false }
```

**Components Involved:**
- `/app/library/page.tsx` - Page wrapper
- `LibraryLayout.tsx` - Main layout
- `LibraryHeader.tsx` - Tabs, search, sort
- `MediaGrid.tsx` - Grid display with infinite scroll
- `MediaCard.tsx` - Individual item card
- `MediaLightbox.tsx` - Full-screen viewer
- `SelectionActionBar.tsx` - Bulk actions
- `useLibraryStore` - State management
- `useLibrarySelection.ts` - Selection logic
- `useBulkActions.ts` - Bulk operations
- `useLibraryLightbox.ts` - Lightbox logic

**APIs Called:**
- Supabase: `fetchLibraryItems()` - Load items
- Supabase: `deleteLibraryItem()` - Delete item
- Supabase: `updateLibraryItem()` - Update metadata

---

## 3. STATE MANAGEMENT MAP

### 3.1 ZUSTAND STORES

#### 3.1.1 Chat Store (chatStore.supabase.ts)

**Purpose:** Manages conversations and messages with Supabase sync

**State:**
```typescript
{
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string | null;
  isGenerating: boolean;
  error: ChatError | null;
  isHydrated: boolean; // Track if loaded from Supabase
}
```

**Actions:**
```typescript
// Initialization
hydrate() - Load from Supabase on mount (protected against multiple calls)

// Messages
setMessages(messages) - Replace all messages
addMessage(message) - Add message (optimistic UI + Supabase sync)
updateMessage(id, content, skipSync?) - Update message content (streaming support)
updateMessageWithAttachments(id, content, attachments, videoTask, generationAttempt) - Update with media
deleteMessage(id) - Delete message

// Conversations
setConversations(conversations) - Replace all conversations
addConversation(conversation) - Add conversation (optimistic UI + Supabase sync)
updateConversation(id, updates) - Update conversation metadata
deleteConversation(id) - Delete conversation

// UI State
setCurrentConversationId(id) - Switch conversation (loads messages)
setIsGenerating(isGenerating) - Set generation state
setError(error) - Set error state

// Utilities
clearMessages() - Clear all messages
clearError() - Clear error
```

**Critical Behaviors:**
- **Hydration:** Runs ONCE on app startup, loads all conversations from Supabase
- **Optimistic UI:** Updates UI immediately, syncs to Supabase in background
- **Streaming:** `skipSync=true` prevents Supabase updates during streaming
- **Conversation Switching:** Loads messages from conversation.messages array in-memory
- **Title Updates:** During streaming, DON'T update updatedAt to prevent reload
- **localStorage:** Persists currentConversationId for page reload recovery

#### 3.1.2 Library Store (libraryStore.v2.ts)

**Purpose:** Manages media library with Supabase sync

**State:**
```typescript
{
  items: LibraryItem[];
  filters: { type, searchQuery, sortBy };
  unseenCount: number;
  isLoading: boolean;
  currentPage: number;
  hasMore: boolean;
}
```

**Actions:**
```typescript
// Loading
loadItems() - Initial load (20 items)
loadMoreItems() - Load next page (20 items)

// CRUD
addItem(item) - Add new item (from chat/workflow)
removeItem(id) - Delete item
updateItem(id, updates) - Update metadata

// Filtering
setFilters(filters) - Update filters
getFilteredItems() - Get filtered items (in-memory)

// Unseen
getUnseenByType(type) - Count unseen by type
markAsSeen(id) - Mark item as seen
```

**Critical Behaviors:**
- **Pagination:** Loads 20 items at a time, infinite scroll
- **In-memory Filtering:** Filters/search/sort applied in-memory (fast)
- **Unseen Tracking:** Counts unseen items per type for badges
- **Auto-mark Seen:** Marks as seen when opened in lightbox

#### 3.1.3 Toast Store (useToast.ts)

**Purpose:** Manages toast notifications

**State:**
```typescript
{
  toasts: Toast[];
}
```

**Actions:**
```typescript
addToast(message, type, duration) - Add toast
removeToast(id) - Remove toast
success(message, duration) - Add success toast
error(message, duration) - Add error toast
info(message, duration) - Add info toast
```

### 3.2 LOCAL COMPONENT STATE

**Chat Components:**
```typescript
// ChatArea.tsx
- mode: "chat" | "image" | "video"
- selectedModel: AIModel
- selectedGPTModel: "gpt-4o" | "gpt-5"
- selectedVideoModel: "move" | "sora2"
- chatName: string
- videoSettings: VideoSettingsType
- imageSettings: ImageSettingsType
- isSuperChatEnabled: boolean
- inputValue: string (controlled input for C1 actions)
- hasImageAttachment: boolean

// ChatInput.tsx
- message: string (controlled or internal)
- attachments: Attachment[]
- isRecording: boolean
- isTranscribing: boolean
- isEnhancing: boolean
- isUploading: boolean
- isDragging: boolean
- cropModalOpen: boolean
- showDropdown: boolean

// ChatMessages.tsx
- copiedId: string | null
- editingId: string | null
- editContent: string
- lightboxImage: { url, name } | null
- lightboxVideo: { url, name } | null
```

**Workflow Components:**
```typescript
// SketchToRender page.tsx
- prompt: string
- renderSettings: RenderSettingsType
- inputData: { sourceImage, referenceImages }
- resultImage: string | null
- resultMediaType: "image" | "video"
- renderName: string
- originalPrompt: string
- recentGenerations: any[]
- currentSourceImage: string | null
- isGeneratingVideo: boolean
- cropModalOpen: boolean
- lightboxOpen: boolean
- lightboxItem: any | null
```

**Library Components:**
```typescript
// LibraryLayout.tsx
- selectedTab: "all" | "videos" | "images" | "favorites"
- searchQuery: string
- sortBy: "newest" | "oldest" | "name"
- selectionMode: boolean
- selectedItems: Set<string>
- lightboxOpen: boolean
- selectedItem: LibraryItem | null
```

### 3.3 CUSTOM HOOKS STATE

**Chat Hooks:**
```typescript
// useVideoQueue.ts
- queue: VideoQueueItem[] // Task ID, status, progress, etc.
- Polling: setInterval every 5 seconds
- Abort controller: For cleanup

// useImageGeneration.ts
- Retry state: attempt counter, last error
- Abort controller: For cleanup

// useVideoGeneration.ts
- Abort controller: For cleanup
- References to callbacks

// useReplyMessage.ts
- replyTo: Message | null
- Mode changes on reply (e.g., image for editing)

// useFileUpload.ts
- attachments: Attachment[]
- isUploading: boolean
- fileInputRef: RefObject

// useVoiceRecording.ts
- isRecording: boolean
- isTranscribing: boolean
- mediaRecorder: MediaRecorder | null

// usePromptEnhancement.ts
- isEnhancing: boolean
- error: string | null
```

**Workflow Hooks:**
```typescript
// useSketchToRender.ts
- isGenerating: boolean
- error: string | null
- progress: number
- currentResult: GenerationResult | null

// useUpscale.ts
- isUpscaling: boolean
- error: string | null
- progress: number
- taskId: string | null
- Polling: setInterval every 5 seconds

// useRenderEdit.ts
- isEditing: boolean
- error: string | null
- progress: number

// usePromptEnhancer.ts (workflow version)
- isEnhancing: boolean
- error: string | null
```

**Library Hooks:**
```typescript
// useLibrarySelection.ts
- selectionMode: boolean
- selectedItems: Set<string>

// useBulkActions.ts
- isProcessing: boolean

// useLibraryLightbox.ts
- selectedItem: LibraryItem | null
- isLightboxOpen: boolean
```

### 3.4 PROP DRILLING PATTERNS

**ChatLayout → ChatArea:**
```typescript
onMenuClick: () => void // Open sidebar on mobile
```

**ChatArea → ChatInput:**
```typescript
onSendMessage: (content, attachments) => void
isGenerating: boolean
onStopGeneration: () => void
mode: "chat" | "image" | "video"
onModeChange: (mode) => void
replyTo: Message | undefined
onCancelReply: () => void
showImageSettings: boolean
imageSettingsSlot: ReactNode
imageSettings: ImageSettingsType
showVideoSettings: boolean
videoSettingsSlot: ReactNode
videoSettings: VideoSettingsType
onImageAttachmentChange: (hasImage) => void
value: string // Controlled input for C1 actions
onValueChange: (value) => void
isSuperChatEnabled: boolean
```

**ChatArea → ChatMessages:**
```typescript
messages: Message[]
isGenerating: boolean
onEditMessage: (messageId, newContent) => void
onReplyMessage: (message, specificAttachment?) => void
onC1Action: (data) => void // Populate input from C1 related query
```

**ChatLayout → ChatSidebar:**
```typescript
isOpen: boolean
onClose: () => void
isCollapsed: boolean
onToggleCollapse: () => void
onNewChat: () => void
conversations: Conversation[]
currentConversationId: string | null
onLoadConversation: (convId) => void
onDeleteConversation: (convId) => void
onDuplicateConversation: (convId) => void
onRenameConversation: (convId, newTitle) => void
```

---

## 4. EXTERNAL INTEGRATIONS

### 4.1 OPENAI API

**Usage:**
- Standard chat (GPT-4o/GPT-5)
- Prompt enhancement
- Chat title generation
- Vision API (PDF analysis, image analysis)
- Whisper (voice transcription)

**Files:**
- `/app/api/chat/route.ts`
- `/app/api/enhance-prompt/route.ts`
- `/app/api/generate-chat-title/route.ts`
- `/app/api/analyze-image/route.ts`
- `/app/api/transcribe/route.ts`

**Configuration:**
```typescript
API_KEY: process.env.OPENAI_API_KEY
Models: gpt-4o, gpt-5, whisper-1
Streaming: Yes (chat only)
Rate Limiting: Yes (chatRateLimiter)
Retry Logic: Yes (exponential backoff)
```

### 4.2 THESYS C1 API (SUPERCHAT)

**Usage:**
- SuperChat mode (Claude Sonnet 4 with Generative UI)

**Files:**
- `/app/api/chat-c1/route.ts`
- `/components/chat/C1Renderer.tsx`

**Configuration:**
```typescript
API_KEY: process.env.THESYS_API_KEY
Base URL: https://api.thesys.dev/v1/embed/
Model: c1/anthropic/claude-sonnet-4/v-20250930
Streaming: Yes
SDK: @thesysai/genui-sdk (dynamic import)
```

**Special Behavior:**
- Dynamic import to avoid build dependency issues
- Returns structured JSON wrapped in <content>...</content> tags
- Supports interactive UI components (cards, charts, buttons)
- Related queries populate input without auto-sending

### 4.3 NANO BANANA API (IMAGE GENERATION)

**Usage:**
- Image generation with reference images
- Sketch-to-render workflow

**Files:**
- `/app/api/generate-image/route.ts`
- `/app/api/sketch-to-render/route.ts`

**Configuration:**
```typescript
API_KEY: process.env.NANOBANANA_API_KEY
Endpoint: https://api.nanobanana.com/v1/generate (or similar)
Model: Gemini Pro Vision
Features: Multi-image support, reference images, settings
Retry Logic: Yes (4 retries API + 2 retries frontend)
```

**Settings:**
```typescript
aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:2" | "21:9"
quality: "standard" | "high" | "ultra"
style: string (e.g., "photorealistic", "artistic")
lighting: string (e.g., "natural", "dramatic")
```

### 4.4 VIDEO GENERATION APIS

#### 4.4.1 Kling AI (payperwork-v1)

**Usage:**
- Video generation (text2video and image2video)

**Files:**
- `/app/api/generate-video/route.ts`

**Configuration:**
```typescript
API_KEY: process.env.KLING_API_KEY
Endpoint: Task-based (POST create, GET poll)
Features: Camera movement, pro/standard mode
Durations: 5s or 10s
Aspect Ratios: 16:9, 9:16, 1:1
```

**Camera Movements:**
- None, Zoom In, Zoom Out, Pan Left, Pan Right, Tilt Up, Tilt Down, etc.

#### 4.4.2 fal.ai Sora 2 (payperwork-v2)

**Usage:**
- Fast video generation (text2video)

**Files:**
- `/app/api/generate-video/route.ts`

**Configuration:**
```typescript
API_KEY: process.env.FAL_API_KEY
Endpoint: Task-based with immediate completion option
Features: Audio support, fast generation (~30s-1min)
Durations: 5s or 10s
Aspect Ratios: 16:9, 9:16, 1:1
```

**Special Behavior:**
- May return video immediately (no polling needed)
- If immediate, marks queue item as complete directly

#### 4.4.3 Runway Gen-4 Turbo

**Usage:**
- Video generation from sketch-to-render results

**Files:**
- `/app/api/generate-runway-video/route.ts`

**Configuration:**
```typescript
API_KEY: process.env.RUNWAY_API_KEY
Endpoint: Task-based
Features: Image2video only
Durations: 5s or 10s
```

### 4.5 FREEPIK MAGNIFIC API (UPSCALING)

**Usage:**
- Image upscaling (4K)

**Files:**
- `/app/api/sketch-to-render/upscale/route.ts`

**Configuration:**
```typescript
API_KEY: process.env.FREEPIK_API_KEY
Endpoint: Task-based (POST create, GET poll)
Features: Sharpen, smart_grain, ultra_detail
Polling: 5-second intervals, max 5 minutes
```

**Settings:**
```typescript
sharpen: 0-100 (default 50)
smart_grain: 0-100 (default 7)
ultra_detail: 0-100 (default 30)
```

**Known Issues:**
- May fail with no credits or inactive subscription
- May return empty array even with "COMPLETED" status

### 4.6 SUPABASE

**Usage:**
- Conversation storage
- Message storage
- Library media storage
- File uploads (images/videos)

**Files:**
- `lib/supabase-chat.ts` - Chat operations
- `lib/supabase-library.ts` - Library operations
- `store/chatStore.supabase.ts` - Chat store integration
- `store/libraryStore.v2.ts` - Library store integration
- `/app/api/upload-chat-image/route.ts` - Image uploads

**Tables:**
```sql
conversations:
  - id: string
  - title: string
  - messages: json[]
  - created_at: timestamp
  - updated_at: timestamp
  - is_superchat_enabled: boolean

library:
  - id: string
  - type: "image" | "video"
  - url: string
  - name: string
  - prompt: string
  - model: string
  - message_id: string
  - conversation_id: string
  - metadata: json
  - created_at: timestamp
  - is_seen: boolean
  - is_favorite: boolean

sketch_to_render_generations:
  - id: string
  - user_id: string
  - url: string
  - type: "render" | "video" | "upscale"
  - source_type: "original" | "from_render" | "from_video"
  - parent_id: string
  - prompt: string
  - model: string
  - settings: json
  - name: string
  - source_image: string
  - created_at: timestamp

storage buckets:
  - chat-images (public)
  - library-media (public)
```

**Operations:**
```typescript
// Chat
fetchConversations() - Load all conversations
createConversation(conversation) - Create new
updateConversation(id, updates) - Update
deleteConversation(id) - Delete
createMessage(conversationId, message) - Create message
updateMessage(id, updates) - Update message
deleteMessage(id) - Delete message

// Library
fetchLibraryItems(offset, limit) - Paginated load
addLibraryItem(item) - Add item
deleteLibraryItem(id) - Delete item
updateLibraryItem(id, updates) - Update metadata

// Uploads
uploadChatImage(base64, fileName, mimeType) - Upload image to storage
```

---

## 5. CRITICAL DEPENDENCIES

### 5.1 COMPONENT DEPENDENCIES

**ChatLayout depends on:**
- ChatSidebar (navigation)
- ChatArea (main interface)
- SearchModal (global search)
- ErrorDisplay (error boundary)
- ToastContainer (notifications)
- useChatStore (state)
- useToastStore (toasts)
- useOnlineStatus (connectivity)
- useNavigationCleanup (cleanup)

**ChatArea depends on:**
- ChatHeader (title, model, superchat toggle)
- ChatMessages (display)
- ChatInput (input)
- ChatWelcome (empty state)
- VideoSettings (settings panel)
- ImageSettings (settings panel)
- useChatStore (state)
- useLibraryStore (library integration)
- useVideoQueue (video polling)
- useReplyMessage (reply system)
- useImageGeneration (image gen)
- useVideoGeneration (video gen)

**ChatInput depends on:**
- InputToolbar (mode/attachments)
- AttachmentGrid (preview)
- InputActions (send/record/enhance)
- ImageCropModal (crop)
- useVoiceRecording (voice)
- useFileUpload (files)
- usePromptEnhancement (enhance)
- useDragAndDrop (drag)
- useImageCropping (crop)
- useInputResize (resize)
- useDropdownMenu (dropdown)

**ChatMessages depends on:**
- MessageBubble (individual message)
- EmptyState (no messages)
- ImageLightbox (full-screen)
- VideoLightbox (full-screen)
- useMessageActions (copy/edit)
- useMessageLightbox (lightbox)

**MessageBubble depends on:**
- MessageContent (text rendering)
- MessageAttachments (media)
- MessageActions (buttons)
- C1Renderer (superchat rendering)

### 5.2 HOOK DEPENDENCIES

**useVideoGeneration depends on:**
- updateMessageWithAttachments (from store)
- addToQueue (from useVideoQueue)
- updateQueueTaskId (from useVideoQueue)
- markVideoCompleted (from useVideoQueue)
- removeFromQueue (from useVideoQueue)
- setIsGenerating (from store)
- setError (from store)
- messages (from store)

**useImageGeneration depends on:**
- updateMessageWithAttachments (from store)
- setIsGenerating (from store)
- setError (from store)
- addToLibrary (from library store)
- messages (from store)

**useVideoQueue depends on:**
- onVideoReady (callback)
- onVideoFailed (callback)
- onProgressUpdate (callback)
- useToast (notifications)
- videoCache (caching)

**useFileUpload depends on:**
- /api/upload (file uploads)

**useVoiceRecording depends on:**
- /api/transcribe (Whisper)
- MediaRecorder API

**usePromptEnhancement depends on:**
- /api/enhance-prompt

### 5.3 DATA FLOW PATTERNS

**Message Creation Flow:**
```
User Input
  → ChatInput (build message)
  → ChatArea.handleSendMessage()
  → useChatStore.addMessage()
  → Supabase (background sync)
  → ChatMessages (display)
  → MessageBubble (render)
```

**Image Generation Flow:**
```
User Input
  → ChatInput (attachments)
  → ChatArea.handleSendMessage()
  → useImageGeneration.generateImage()
  → /api/generate-image (with retries)
  → /api/upload-chat-image (Supabase)
  → useChatStore.updateMessageWithAttachments()
  → useLibraryStore.addItem()
  → ChatMessages (display)
  → MessageAttachments (render)
```

**Video Generation Flow:**
```
User Input
  → ChatInput (settings)
  → ChatArea.handleSendMessage()
  → useVideoGeneration.handleVideoGeneration()
  → useVideoQueue.addToQueue() (temp ID)
  → /api/generate-video (get real task ID)
  → useVideoQueue.updateQueueTaskId()
  → useVideoQueue polling loop (every 5s)
  → /api/generate-video?task_id=xxx (status)
  → useVideoQueue.onVideoReady()
  → useChatStore.updateMessageWithAttachments()
  → useLibraryStore.addItem()
  → ChatMessages (display)
  → VideoAttachment (render)
```

**Conversation Switch Flow:**
```
User Click
  → ChatSidebar.ConversationItem
  → ChatLayout.handleLoadConversation()
  → useChatStore.setCurrentConversationId()
  → Load messages from conversation.messages (in-memory)
  → ChatMessages re-render
  → Auto-scroll to bottom
```

---

## 6. CUSTOM HOOKS INVENTORY

### 6.1 CHAT HOOKS

| Hook | File | Purpose | State | Dependencies |
|------|------|---------|-------|--------------|
| useVideoGeneration | `hooks/chat/useVideoGeneration.ts` | Video generation logic | abortController | updateMessage, addToQueue, APIs |
| useImageGeneration | `hooks/chat/useImageGeneration.ts` | Image generation with retry | abortController, retry counter | updateMessage, addToLibrary, APIs |
| useVideoQueue | `hooks/useVideoQueue.ts` | Queue management & polling | queue, pollInterval | onVideoReady, onVideoFailed, onProgressUpdate |
| useReplyMessage | `hooks/chat/useReplyMessage.ts` | Reply system | replyTo | onModeChange, onImageSettingsChange |
| useMessageActions | `hooks/chat/useMessageActions.ts` | Copy/edit actions | copiedId, editingId, editContent | onEditMessage |
| useMessageLightbox | `hooks/chat/useMessageLightbox.ts` | Lightbox state | lightboxImage, lightboxVideo | - |
| useChatSearch | `hooks/chat/useChatSearch.ts` | Search conversations | searchResults | conversations |

### 6.2 INPUT HOOKS

| Hook | File | Purpose | State | Dependencies |
|------|------|---------|-------|--------------|
| useFileUpload | `hooks/useFileUpload.ts` | File attachment management | attachments, isUploading | /api/upload |
| useVoiceRecording | `hooks/useVoiceRecording.ts` | Voice recording & transcription | isRecording, isTranscribing | MediaRecorder, /api/transcribe |
| usePromptEnhancement | `hooks/usePromptEnhancement.ts` | Prompt enhancement | isEnhancing, error | /api/enhance-prompt |
| useDragAndDrop | `hooks/chat/input/useDragAndDrop.ts` | Drag & drop overlay | isDragging | - |
| useImageCropping | `hooks/chat/input/useImageCropping.ts` | Image crop modal | cropModalOpen, cropImageUrl | - |
| useInputResize | `hooks/chat/input/useInputResize.ts` | Textarea auto-resize | textareaRef | - |
| useDropdownMenu | `hooks/chat/input/useDropdownMenu.ts` | Mode dropdown | showDropdown | - |

### 6.3 WORKFLOW HOOKS

| Hook | File | Purpose | State | Dependencies |
|------|------|---------|-------|--------------|
| useSketchToRender | `hooks/workflows/useSketchToRender.ts` | Main render generation | isGenerating, progress, error | /api/sketch-to-render |
| useRenderEdit | `hooks/workflows/useRenderEdit.ts` | Edit existing render | isEditing, progress, error | /api/sketch-to-render |
| useUpscale | `hooks/workflows/useUpscale.ts` | Image upscaling | isUpscaling, progress, taskId | /api/sketch-to-render/upscale |
| usePromptEnhancer | `hooks/workflows/usePromptEnhancer.ts` | Prompt enhancement | isEnhancing, error | /api/sketch-to-render/enhance-prompt |

### 6.4 LIBRARY HOOKS

| Hook | File | Purpose | State | Dependencies |
|------|------|---------|-------|--------------|
| useLibrarySelection | `hooks/library/useLibrarySelection.ts` | Selection mode | selectionMode, selectedItems | - |
| useBulkActions | `hooks/library/useBulkActions.ts` | Bulk operations | isProcessing | removeItem |
| useLibraryLightbox | `hooks/library/useLibraryLightbox.ts` | Lightbox navigation | selectedItem, isOpen | markAsSeen |
| useMediaCardActions | `hooks/library/useMediaCardActions.ts` | Card actions | - | updateItem, removeItem |

### 6.5 UTILITY HOOKS

| Hook | File | Purpose | State | Dependencies |
|------|------|---------|-------|--------------|
| useToast | `hooks/useToast.ts` | Toast notifications | toasts | - |
| useOnlineStatus | `hooks/useOnlineStatus.ts` | Network status | isOnline | - |
| useNavigationCleanup | `hooks/useNavigationCleanup.ts` | Cleanup on navigation | - | - |

### 6.6 CONVERSATION HOOKS

| Hook | File | Purpose | State | Dependencies |
|------|------|---------|-------|--------------|
| useConversations | `hooks/conversations/useConversations.ts` | Conversation list | - | useChatStore |
| useConversationActions | `hooks/conversations/useConversationActions.ts` | CRUD actions | - | useChatStore |
| useConversationSwitch | `hooks/conversations/useConversationSwitch.ts` | Switch logic | - | useChatStore, router |
| useConversationTitle | `hooks/conversations/useConversationTitle.ts` | Title generation | - | /api/generate-chat-title |

---

## 7. COMPONENT ARCHITECTURE

### 7.1 PAGE COMPONENTS

```
/app/chat/page.tsx
  → ChatLayout.tsx (main orchestrator)
    → ChatSidebar (navigation)
      → SidebarHeader
      → NewChatButton
      → SidebarSearch
      → NavigationSection
        → WorkflowList
      → ConversationList
        → ConversationItem
          → ConversationMenu
      → SidebarFooter
    → ChatArea (main interface)
      → ChatHeader
      → ChatWelcome (empty state)
      → ChatMessages
        → MessageBubble
          → MessageContent
            → C1Renderer (if SuperChat)
            → ReactMarkdown (if standard)
          → MessageAttachments
            → ImageAttachment
            → VideoAttachment
            → PDFAttachment
          → MessageActions
      → ChatInput
        → InputToolbar
        → AttachmentGrid
        → InputActions
        → ImageSettings (slot)
        → VideoSettings (slot)
    → SearchModal
    → ErrorDisplay
    → ToastContainer

/app/library/page.tsx
  → LibraryLayout
    → LibraryHeader
      → Tabs
      → Search
      → Sort
      → Selection Toggle
    → SelectionActionBar (if selection mode)
    → MediaGrid
      → MediaCard
        → MediaCardActions
        → MediaCardMetadata
    → MediaLightbox
      → Full-screen viewer
      → Navigation
      → Actions

/app/workflows/sketch-to-render/page.tsx
  → ChatSidebar (navigation)
  → InputsPanel
    → Source image upload
    → Reference images upload
  → InputImagesPanel
    → Image preview grid
    → Crop buttons
  → RenderPromptInput
    → Textarea
    → Enhance button
  → RenderSettings
    → Aspect ratio
    → Style
    → Quality
  → ResultPanel
    → Result image
    → Actions (edit, upscale, video, download)
  → RecentGenerations
    → Generation cards
    → Actions
  → RenderLightbox
    → Before/after comparison
  → ImageCropModal
```

### 7.2 SHARED COMPONENTS

```
components/shared/
  → Toast.tsx (notification system)
  → SettingsCard.tsx (reusable settings panel)
  → SettingsDropdown.tsx (reusable dropdown)

components/chat/shared/
  → ImageLightbox.tsx (full-screen image viewer)
  → VideoLightbox.tsx (full-screen video player)
  → SearchModal.tsx (global search)
```

### 7.3 COMPONENT COMPOSITION PATTERNS

**Slot Pattern (Settings):**
```tsx
<ChatInput
  showImageSettings={mode === "image"}
  imageSettingsSlot={
    <ImageSettings
      settings={imageSettings}
      onSettingsChange={setImageSettings}
    />
  }
/>
```

**Render Props Pattern:**
```tsx
<MediaGrid
  items={filteredItems}
  renderItem={(item) => (
    <MediaCard
      item={item}
      onAction={handleAction}
    />
  )}
/>
```

**Compound Components:**
```tsx
<ConversationItem conversation={conv}>
  <ConversationItem.Title>{conv.title}</ConversationItem.Title>
  <ConversationItem.Menu>
    <MenuItem onClick={handleEdit}>Edit</MenuItem>
    <MenuItem onClick={handleDelete}>Delete</MenuItem>
  </ConversationItem.Menu>
</ConversationItem>
```

---

## 8. API ENDPOINTS

### 8.1 CHAT APIS

| Endpoint | Method | Purpose | Request | Response | Provider |
|----------|--------|---------|---------|----------|----------|
| /api/chat | POST | Standard chat | messages, gptModel | SSE stream | OpenAI GPT-4o/5 |
| /api/chat-c1 | POST | SuperChat | messages | SSE stream | Thesys C1 (Claude Sonnet 4) |
| /api/generate-chat-title | POST | Title generation | prompt | { title } | OpenAI GPT-4o |
| /api/enhance-prompt | POST | Prompt enhancement | prompt, mode, context | { enhancedPrompt } | OpenAI GPT-4o |

### 8.2 GENERATION APIS

| Endpoint | Method | Purpose | Request | Response | Provider |
|----------|--------|---------|---------|----------|----------|
| /api/generate-image | POST | Image generation | prompt, referenceImages, settings | { images } | Nano Banana |
| /api/generate-video | POST | Start video generation | model, type, prompt, image, settings | { task_id, status } | Kling/fal.ai |
| /api/generate-video | GET | Poll video status | task_id, model, type | { status, videos } | Kling/fal.ai |
| /api/generate-runway-video | POST | Runway video | imageUrl, prompt, duration | { task_id, status } | Runway Gen-4 |

### 8.3 WORKFLOW APIS

| Endpoint | Method | Purpose | Request | Response | Provider |
|----------|--------|---------|---------|----------|----------|
| /api/sketch-to-render | POST | Generate render | prompt, sourceImage, settings | { image, metadata } | Nano Banana |
| /api/sketch-to-render/enhance-prompt | POST | Enhance prompt | prompt, context | { enhancedPrompt } | OpenAI GPT-4o |
| /api/sketch-to-render/upscale | POST | Start upscale | image, settings | { task_id, status } | Freepik Magnific |
| /api/sketch-to-render/upscale | GET | Poll upscale | task_id | { status, generated } | Freepik Magnific |
| /api/sketch-to-render/generations | GET | Load history | userId | { generations } | Supabase |
| /api/sketch-to-render/save-generation | POST | Save to DB | url, type, metadata | { id } | Supabase |

### 8.4 UTILITY APIS

| Endpoint | Method | Purpose | Request | Response | Provider |
|----------|--------|---------|---------|----------|----------|
| /api/upload | POST | Upload file | file | { url } | Supabase Storage |
| /api/upload-chat-image | POST | Upload chat image | base64Data, fileName | { url } | Supabase Storage |
| /api/transcribe | POST | Voice to text | audioBlob | { text } | OpenAI Whisper |
| /api/analyze-image | POST | Image analysis | imageUrl | { description } | OpenAI Vision |
| /api/parse-pdf | POST | PDF to text | pdfUrl | { text, pages } | PDF.js |
| /api/test-supabase | GET | Test connection | - | { status } | Supabase |

### 8.5 API PATTERNS

**Streaming APIs:**
- /api/chat
- /api/chat-c1

Format: `data: {"content": "..."}\n\n` (SSE)

**Task-based APIs:**
- /api/generate-video
- /api/sketch-to-render/upscale
- /api/generate-runway-video

Pattern:
1. POST: Create task, get task_id
2. GET: Poll status with task_id
3. Continue until status = "succeed" or "failed"

**Retry Logic:**
- Image generation: 2 frontend retries + 4 API retries = 15 total
- Video polling: Max 10 consecutive errors before auto-fail
- Exponential backoff: 2s, 4s, 8s...

**Rate Limiting:**
- Implemented for chat APIs
- Uses IP-based identification
- Returns 429 with Retry-After header

---

## 9. CRITICAL WORKAROUNDS & EDGE CASES

### 9.1 KNOWN WORKAROUNDS

**1. C1Component Dynamic Import**
- **Issue:** @thesysai/genui-sdk has missing peer dependencies, causes build errors
- **Solution:** Dynamic import in C1Renderer.tsx at runtime only
- **Location:** `components/chat/C1Renderer.tsx` (lines 33-63)
- **Impact:** Standard chat can work independently of C1 dependencies

**2. Video Queue Temp Task IDs**
- **Issue:** Queue needs to show video immediately, but real task ID not available yet
- **Solution:** Use temp ID (temp-123), update with real ID when API returns
- **Location:** `useVideoGeneration.ts` (lines 142-154), `useVideoQueue.ts` (lines 172-176)
- **Impact:** Must update queue task ID before polling starts

**3. Streaming Supabase Sync**
- **Issue:** Updating Supabase on every streaming chunk is too slow
- **Solution:** skipSync flag prevents Supabase updates during streaming
- **Location:** `chatStore.supabase.ts` (lines 218-243)
- **Impact:** Only final message is synced to Supabase

**4. Conversation Title Update During Streaming**
- **Issue:** Updating conversation.updatedAt during streaming causes reload
- **Solution:** Don't update updatedAt for title changes, only for message changes
- **Location:** `ChatLayout.tsx` (lines 110-165)
- **Impact:** Title updates don't trigger conversation re-sorting

**5. Hydration Race Condition**
- **Issue:** Multiple components calling hydrate() causes duplicate Supabase queries
- **Solution:** Global flags (hasHydrated, isHydrating) prevent multiple calls
- **Location:** `chatStore.supabase.ts` (lines 61-64)
- **Impact:** Only one hydration per app session

**6. Freepik Empty Array Bug**
- **Issue:** Freepik API returns status="COMPLETED" but generated=[] (empty)
- **Solution:** Check for both status and non-empty array before marking complete
- **Location:** `useUpscale.ts` (lines 94-119)
- **Impact:** Better error messages for users

**7. Message Array Safety Check**
- **Issue:** Sometimes messages is not an array (undefined or null)
- **Solution:** Always check Array.isArray() before operations
- **Location:** `ChatMessages.tsx` (lines 100-105), `chatStore.supabase.ts` (lines 192-195)
- **Impact:** Prevents crashes, recovers gracefully

### 9.2 EDGE CASES

**1. User Switches Conversation During Streaming**
- **Behavior:** Abort current stream, switch conversation
- **Location:** `ChatArea.tsx` (lines 236-250)
- **Implementation:** AbortController with prevConversationIdRef

**2. User Closes Browser During Video Generation**
- **Behavior:** Queue is lost (in-memory), polling stops
- **Future:** Could persist queue to Supabase for recovery
- **Location:** N/A (not implemented)

**3. User Deletes Current Conversation**
- **Behavior:** Reset to welcome screen, clear messages
- **Location:** `ChatLayout.tsx` (lines 254-264)
- **Implementation:** Check if deleted === current, reset if true

**4. Network Disconnection During Upload**
- **Behavior:** useOnlineStatus hook detects, shows warning
- **Location:** `hooks/useOnlineStatus.ts`, `ChatLayout.tsx` (line 24)
- **Implementation:** window.addEventListener('online'/'offline')

**5. SuperChat Toggle During Active Conversation**
- **Behavior:** Future messages use new mode, existing messages unchanged
- **Location:** `ChatArea.tsx` (lines 436-443)
- **Implementation:** Per-conversation toggle, updates Supabase

**6. Image Generation with 0 Credits**
- **Behavior:** API returns 429 or credit error, retry disabled
- **Location:** `useImageGeneration.ts` (lines 254-258)
- **Implementation:** Check retryable flag, don't retry if false

**7. Video Polling Never Completes**
- **Behavior:** After 10 consecutive errors, auto-fail
- **Location:** `useVideoQueue.ts` (lines 326-372)
- **Implementation:** consecutiveErrors counter

**8. User Edits Message While Generating**
- **Behavior:** Not allowed (edit disabled during isGenerating)
- **Location:** `MessageBubble.tsx` (edit button disabled)
- **Implementation:** Conditional rendering based on isGenerating

**9. Multiple Videos Generating Simultaneously**
- **Behavior:** Queue manages all, polls with concurrency limit
- **Location:** `useVideoQueue.ts` (lines 389-390)
- **Implementation:** promiseAllWithLimit(tasks, 5)

**10. Lightbox Open + Keyboard Shortcuts**
- **Behavior:** Lightbox captures keyboard events, prevents conflicts
- **Location:** `LibraryLayout.tsx` (lines 89-117), `MediaLightbox.tsx`
- **Implementation:** Check isLightboxOpen before handling shortcuts

---

## 10. PERFORMANCE OPTIMIZATIONS

### 10.1 IMPLEMENTED OPTIMIZATIONS

**1. ChatMessages Memoization**
- **Location:** `ChatMessages.tsx` (lines 163-209)
- **Technique:** React.memo with custom comparison
- **Impact:** Re-renders only when message content/count changes

**2. Video Cache**
- **Location:** `lib/utils/videoCache.ts`
- **Technique:** In-memory Map with 15-minute TTL
- **Impact:** Faster video re-access without API call

**3. Library Pagination**
- **Location:** `store/libraryStore.v2.ts`
- **Technique:** Load 20 items at a time, infinite scroll
- **Impact:** Faster initial load, less memory usage

**4. In-memory Filtering**
- **Location:** `store/libraryStore.v2.ts` (getFilteredItems)
- **Technique:** Filter/search/sort after loading, no API calls
- **Impact:** Instant filter updates

**5. Optimistic UI Updates**
- **Location:** `chatStore.supabase.ts` (all actions)
- **Technique:** Update UI immediately, sync to Supabase in background
- **Impact:** Feels instant, even with slow network

**6. Streaming Batch Updates**
- **Location:** `lib/utils/streamingHelpers.ts` (createUpdateScheduler)
- **Technique:** Batch updates every 50ms during streaming
- **Impact:** Smoother streaming, less re-renders

**7. Dynamic Import of C1Component**
- **Location:** `C1Renderer.tsx` (lines 33-63)
- **Technique:** Load @thesysai/genui-sdk only when needed
- **Impact:** Smaller bundle, faster initial load

**8. Image Compression Before Upload**
- **Location:** `useUpscale.ts` (lines 195-248)
- **Technique:** Resize to max 1920px, JPEG 0.92 quality
- **Impact:** Faster uploads, lower bandwidth

### 10.2 POTENTIAL OPTIMIZATIONS (NOT YET IMPLEMENTED)

**1. Virtual Scrolling for Long Message Lists**
- **Tool:** react-window or react-virtual
- **Impact:** Handle 1000+ messages without lag

**2. Incremental Static Regeneration for Workflows**
- **Tool:** Next.js ISR
- **Impact:** Faster page loads for workflow pages

**3. Service Worker for Offline Support**
- **Tool:** next-pwa
- **Impact:** Work offline, cache assets

**4. Image CDN for Library**
- **Tool:** Cloudflare Images or Imgix
- **Impact:** Faster image loading, automatic optimization

**5. WebSocket for Real-time Updates**
- **Tool:** Supabase Realtime
- **Impact:** Multi-device sync without polling

---

## 11. TESTING CHECKLIST FOR REFACTORING

### 11.1 MUST TEST FLOWS

**Standard Chat:**
- [ ] Create new conversation (auto-title generation)
- [ ] Send message (streaming works)
- [ ] Edit message (regenerates from that point)
- [ ] Reply to message (context preserved)
- [ ] Switch conversations (messages load correctly)
- [ ] Delete conversation (resets to welcome)
- [ ] Page reload (conversation restored)
- [ ] Copy message (clipboard works)

**SuperChat (C1):**
- [ ] Toggle SuperChat on/off
- [ ] Send message (C1 streaming works)
- [ ] Related queries populate input
- [ ] Interactive components render
- [ ] Fallback to standard if SDK fails

**Image Generation:**
- [ ] Generate without reference (works)
- [ ] Generate with reference (consistency)
- [ ] Reply to image (editing mode)
- [ ] Retry on failure (exponential backoff)
- [ ] Multiple images (all display)
- [ ] Add to library (appears)

**Video Generation:**
- [ ] Text2Video (no image)
- [ ] Image2Video (with image)
- [ ] Kling (camera movement works)
- [ ] fal.ai (immediate completion)
- [ ] Queue management (multiple videos)
- [ ] Polling (progress updates)
- [ ] Completion (notification + library)
- [ ] Failure handling (error message)

**Sketch-to-Render:**
- [ ] Upload source image
- [ ] Upload reference images
- [ ] Crop images
- [ ] Generate render
- [ ] Edit render
- [ ] Upscale render (polling)
- [ ] Generate video from render
- [ ] Recent generations load
- [ ] Lightbox before/after

**Library:**
- [ ] Load items (pagination)
- [ ] Filter by type (all/videos/images/favorites)
- [ ] Search (real-time)
- [ ] Sort (newest/oldest/name)
- [ ] Selection mode (bulk actions)
- [ ] Lightbox (navigation, download, delete)
- [ ] Unseen badges (count correct)
- [ ] Mark as seen (badge disappears)

**File Uploads:**
- [ ] Upload images (multiple)
- [ ] Upload PDFs (parse text)
- [ ] Upload videos
- [ ] Drag and drop (overlay shows)
- [ ] Image cropping (preserves original)
- [ ] Remove attachment

**Voice Recording:**
- [ ] Start recording (icon changes)
- [ ] Stop recording (transcription starts)
- [ ] Transcription fills input
- [ ] Error handling (no mic access)

**Prompt Enhancement:**
- [ ] Enhance button works
- [ ] Context included (mode, attachments, reply)
- [ ] Result fills input
- [ ] Error handling

### 11.2 EDGE CASES TO TEST

- [ ] Switch conversation during streaming
- [ ] Delete current conversation
- [ ] Close browser during video generation
- [ ] Network disconnection during upload
- [ ] Multiple videos generating simultaneously
- [ ] Edit message while generating (disabled)
- [ ] Keyboard shortcuts in lightbox
- [ ] Empty conversation list
- [ ] Empty library
- [ ] Long message list (1000+ messages)
- [ ] Large image uploads (10MB+)
- [ ] Rapid message sending
- [ ] SuperChat toggle during active conversation

---

## 12. MIGRATION NOTES

### 12.1 IF REFACTORING CHAT SYSTEM

**Must Preserve:**
1. Dual chat mode system (standard + SuperChat)
2. Message streaming with skipSync flag
3. Conversation auto-creation on first message
4. Title generation AFTER streaming completes
5. AbortController cleanup patterns
6. Video queue with temp→real task ID flow
7. Retry logic for image generation
8. Reply system with context
9. Edit message removes all after
10. C1Renderer dynamic import pattern

**Can Change:**
1. Component structure (as long as props preserved)
2. Hook names (as long as logic identical)
3. File organization (as long as imports work)
4. Styling (as long as functionality works)

### 12.2 IF REFACTORING WORKFLOWS

**Must Preserve:**
1. Auto-naming pattern for generations
2. Recent generations database integration
3. Before/after lightbox comparison
4. Task-based polling for upscale
5. Compression before upscale
6. Source image preservation for editing
7. Video generation from renders

**Can Change:**
1. UI layout
2. Settings organization
3. Progress indicators
4. Error messages

### 12.3 IF REFACTORING LIBRARY

**Must Preserve:**
1. Pagination (20 items at a time)
2. In-memory filtering (fast)
3. Unseen count tracking
4. Selection mode with bulk actions
5. Lightbox keyboard navigation
6. Mark as seen on view

**Can Change:**
1. Grid layout
2. Card design
3. Lightbox UI
4. Filter UI

---

## 13. ENVIRONMENT VARIABLES REQUIRED

```bash
# OpenAI
OPENAI_API_KEY=

# Thesys C1 (SuperChat)
THESYS_API_KEY=

# Nano Banana (Image Generation)
NANOBANANA_API_KEY=

# Kling AI (Video v1)
KLING_API_KEY=

# fal.ai (Video v2)
FAL_API_KEY=

# Runway (Workflow Video)
RUNWAY_API_KEY=

# Freepik Magnific (Upscaling)
FREEPIK_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 14. CONCLUSION

This document provides a complete inventory of ALL features, flows, state management patterns, external integrations, and dependencies in the Payperwork Next.js application. Use this as a reference during refactoring to ensure ZERO functionality loss.

**Key Takeaways:**
1. The application has 3 main areas: Chat, Sketch-to-Render Workflow, Library
2. State management uses Zustand with Supabase sync (optimistic UI pattern)
3. Video generation uses complex queue + polling system with temp→real task ID flow
4. Image generation has sophisticated retry logic (exponential backoff)
5. SuperChat (C1) uses dynamic import to avoid build dependency issues
6. All major flows are documented with step-by-step breakdowns
7. Custom hooks are well-organized and reusable
8. API integrations are centralized and follow consistent patterns

**Before Refactoring ANY Component:**
1. Read the relevant section in this document
2. Understand ALL state variables used
3. Understand ALL dependencies (hooks, props, context)
4. Test the existing flow thoroughly
5. Refactor with same behavior
6. Test again with the checklist

**After Refactoring:**
1. Run through all test flows
2. Check edge cases
3. Verify performance is same or better
4. Update this document with any changes

---

**Document Version:** 1.0
**Last Updated:** 2025-10-15
**Maintainer:** Development Team
