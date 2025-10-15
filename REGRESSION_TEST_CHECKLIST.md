# REGRESSION TEST CHECKLIST - Payperwork Application

**Purpose**: Verify all features work correctly after code changes. Use this checklist before deploying to production.

**Test Environment**: Local development server (http://localhost:3000)

---

## BEFORE TESTING

### Environment Setup
- [ ] Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
- [ ] Open browser DevTools Console (F12)
- [ ] Verify dev server is running: `npm run dev`
- [ ] Check Supabase connection is active
- [ ] Verify API keys are configured in .env.local

### Test Assets Preparation
- [ ] Have 2-3 test images ready (JPG/PNG, various sizes)
- [ ] Have 1 test PDF ready (multi-page preferred)
- [ ] Have test sketch/architectural image ready
- [ ] Clear any existing test data if needed

### Console Monitoring
- [ ] Keep Console open during ALL tests
- [ ] **CRITICAL**: Note any errors, warnings, or failed network requests
- [ ] Screenshot any errors that occur

---

## 1. CHAT FUNCTIONALITY

### 1.1 Starting New Conversation
**Steps:**
- [ ] Navigate to `/chat`
- [ ] Verify welcome screen shows with example prompts
- [ ] Click "New Chat" button in sidebar
- [ ] **Expected**: Empty chat state loads, input is focused
- [ ] **Check Console**: No errors
- [ ] **Check UI**: Chat name shows "Neuer Chat"

### 1.2 Send Text Message (Standard Chat)
**Steps:**
- [ ] Verify SuperChat toggle is OFF (gray)
- [ ] Type: "Hello, how are you?"
- [ ] Press Enter
- [ ] **Expected**:
  - User message appears instantly
  - AI assistant message streams in with typing effect
  - Message appears in conversation list on sidebar
  - Chat name auto-updates from "Neuer Chat" to message-based name
- [ ] **Check Console**: No errors
- [ ] **Check Network**: POST to `/api/chat` succeeds (200)
- [ ] **Check Database**: Reload page - messages still there
- [ ] **Visual Check**:
  - User messages aligned right, white background
  - Assistant messages aligned left, gray background
  - Markdown formatting works (try **bold**, *italic*)

### 1.3 Send Text Message (SuperChat with C1)
**Steps:**
- [ ] Toggle SuperChat switch ON (should turn yellow/accent color)
- [ ] Type: "Show me a chart of programming languages popularity"
- [ ] Press Enter
- [ ] **Expected**:
  - User message appears
  - AI response includes interactive components (buttons, charts, etc.)
  - C1 components render with proper styling
  - "Related Query" buttons appear below
- [ ] Click on a "Related Query" button
- [ ] **Expected**: Query text populates input field (does NOT auto-send)
- [ ] **Check Console**: C1 SDK loads without errors
- [ ] **Check Network**: POST to `/api/chat-c1` succeeds (200)
- [ ] **Visual Check**: Interactive components are clickable and functional

### 1.4 Upload and Send Image
**Steps:**
- [ ] Click paperclip icon in input
- [ ] Select 1 image file (JPG or PNG)
- [ ] **Expected**: Image preview appears above input
- [ ] Add text: "Describe this image"
- [ ] Click Send
- [ ] **Expected**:
  - User message shows with image thumbnail
  - AI analyzes image and responds with description
  - Image is stored in Supabase (not base64 in message after reload)
- [ ] Reload page
- [ ] **Expected**: Image still loads from Supabase URL
- [ ] **Check Console**: No base64 strings logged after reload
- [ ] **Check Network**:
  - POST to `/api/upload-chat-image` succeeds
  - Image URL is from Supabase storage

### 1.5 Upload Multiple Images
**Steps:**
- [ ] Click paperclip icon
- [ ] Select 2-3 images at once
- [ ] **Expected**: All previews appear in grid layout
- [ ] Hover over each preview
- [ ] **Expected**: Edit and Delete buttons appear
- [ ] Click X on one image
- [ ] **Expected**: That image is removed from preview
- [ ] Send remaining images with prompt
- [ ] **Expected**: All images appear in user message

### 1.6 Image Editing (Crop)
**Steps:**
- [ ] Upload an image
- [ ] Click "Edit" icon on image preview
- [ ] **Expected**: Image crop modal opens
- [ ] Drag to select crop area
- [ ] Click "Crop" or "Done"
- [ ] **Expected**:
  - Modal closes
  - Preview shows cropped version
  - Original image is preserved for re-editing
- [ ] Click Edit again
- [ ] **Expected**: Original uncropped image shown in modal
- [ ] Click "Reset" in modal
- [ ] **Expected**: Crop selection resets to full image
- [ ] Cancel modal
- [ ] **Expected**: Previous crop is maintained

### 1.7 Upload and Send PDF
**Steps:**
- [ ] Click paperclip icon
- [ ] Select a PDF file
- [ ] **Expected**: PDF preview shows with file icon and name
- [ ] Add prompt: "Summarize this document"
- [ ] Send
- [ ] **Expected**:
  - User message shows PDF attachment
  - AI reads PDF content and provides summary
- [ ] **Check Console**: No errors
- [ ] **Check Network**: PDF upload succeeds

### 1.8 Voice Recording
**Steps:**
- [ ] Click microphone icon in input
- [ ] **Expected**: Browser asks for microphone permission (if first time)
- [ ] Allow microphone access
- [ ] **Expected**: Recording indicator shows (red dot or animation)
- [ ] Speak: "Test voice message"
- [ ] Click microphone icon again to stop
- [ ] **Expected**:
  - "Transcribing..." indicator shows
  - Transcribed text appears in input field
  - Input remains focused for editing
- [ ] Edit transcribed text if needed
- [ ] Send message
- [ ] **Check Console**: No errors
- [ ] **Check**: Transcription accuracy

### 1.9 Prompt Enhancement
**Steps:**
- [ ] Type short/vague prompt: "make image"
- [ ] Click sparkle/wand icon (Enhance button)
- [ ] **Expected**:
  - Button shows loading spinner
  - Enhanced prompt replaces original
  - Input auto-resizes to fit enhanced text
- [ ] Review enhanced prompt
- [ ] **Expected**: Prompt is more detailed and specific
- [ ] Send enhanced prompt
- [ ] **Check Console**: POST to `/api/enhance-prompt` succeeds

### 1.10 Message Actions - Copy
**Steps:**
- [ ] Send any message and get AI response
- [ ] Hover over assistant message
- [ ] **Expected**: Action buttons appear (Copy, Edit, Reply)
- [ ] Click Copy icon
- [ ] **Expected**:
  - Checkmark appears briefly
  - Toast notification: "Copied to clipboard"
- [ ] Paste in a text editor (Cmd+V / Ctrl+V)
- [ ] **Expected**: Message content is pasted correctly
- [ ] **Visual Check**: Markdown formatting is preserved

### 1.11 Message Actions - Edit
**Steps:**
- [ ] Hover over YOUR user message (not assistant)
- [ ] Click Edit icon
- [ ] **Expected**: Message becomes editable textarea
- [ ] Change text to: "Edited message test"
- [ ] Press Enter or click Save
- [ ] **Expected**:
  - Message updates
  - All messages AFTER edited message are DELETED
  - New AI response generates based on edited message
- [ ] **Check Console**: No errors
- [ ] **Check Database**: Old messages after edit point are gone

### 1.12 Message Actions - Reply
**Steps:**
- [ ] Hover over ANY message (user or assistant)
- [ ] Click Reply icon
- [ ] **Expected**:
  - Reply preview appears above input
  - Preview shows truncated message content
  - X button to cancel reply
- [ ] Type: "Following up on this"
- [ ] Send
- [ ] **Expected**:
  - User message includes reply reference
  - Context from replied message is sent to AI
  - Reply preview disappears after sending
- [ ] Click X on reply preview (before sending)
- [ ] **Expected**: Reply is cancelled

### 1.13 Reply with Image Context
**Steps:**
- [ ] Send message with an image, get AI response
- [ ] Hover over AI response about the image
- [ ] Click Reply icon
- [ ] **Expected**:
  - Reply preview shows (may include image reference)
  - Original image context is available to AI
- [ ] Type: "Can you tell me more about this?"
- [ ] Send
- [ ] **Expected**: AI references the original image in new response

### 1.14 Conversation Switching
**Steps:**
- [ ] Create 2-3 different conversations
- [ ] Send different messages in each
- [ ] Click on different conversation in sidebar
- [ ] **Expected**:
  - Messages load instantly from Supabase
  - Correct chat name appears in header
  - Input state is preserved (empty after switch)
  - SuperChat toggle state matches conversation setting
- [ ] Send message in switched conversation
- [ ] **Expected**: Message goes to correct conversation
- [ ] **Check Database**: Message saved to correct conversation_id
- [ ] **Performance Check**: Switching feels instant (no loading delay)

### 1.15 Conversation Search
**Steps:**
- [ ] Create conversations with distinct messages
- [ ] Click Search icon in sidebar
- [ ] **Expected**: Search modal opens
- [ ] Type: "test" (or any keyword from messages)
- [ ] **Expected**:
  - Search results appear in real-time
  - Matching messages highlighted
  - Shows conversation name and timestamp
- [ ] Click on a search result
- [ ] **Expected**:
  - Modal closes
  - That conversation opens
  - Page scrolls to exact message (highlighted briefly)
- [ ] **Check Console**: Search query doesn't cause errors

### 1.16 Conversation Management - Rename
**Steps:**
- [ ] Hover over conversation in sidebar
- [ ] Click three-dot menu
- [ ] Click "Rename"
- [ ] **Expected**: Inline edit field appears
- [ ] Type new name: "Test Conversation Renamed"
- [ ] Press Enter
- [ ] **Expected**:
  - Name updates in sidebar
  - Name updates in header if conversation is active
- [ ] **Check Database**: Title updated in Supabase
- [ ] Reload page
- [ ] **Expected**: New name persists

### 1.17 Conversation Management - Duplicate
**Steps:**
- [ ] Hover over conversation with messages
- [ ] Click three-dot menu → "Duplicate"
- [ ] **Expected**:
  - New conversation appears in sidebar
  - Name has "(Kopie)" suffix
  - All messages are copied
- [ ] Open duplicated conversation
- [ ] **Expected**: All messages are there
- [ ] Edit message in duplicate
- [ ] **Expected**: Original conversation is NOT affected

### 1.18 Conversation Management - Delete
**Steps:**
- [ ] Hover over a test conversation
- [ ] Click three-dot menu → "Delete"
- [ ] **Expected**: Confirmation dialog appears
- [ ] Click "Cancel"
- [ ] **Expected**: Conversation still exists
- [ ] Try delete again, click "Confirm"
- [ ] **Expected**:
  - Conversation removed from sidebar
  - If was active, redirects to empty chat or another conversation
- [ ] **Check Database**: Conversation deleted from Supabase
- [ ] Reload page
- [ ] **Expected**: Deleted conversation doesn't come back

### 1.19 Chat Name Editing
**Steps:**
- [ ] In active conversation, click on chat name in header
- [ ] **Expected**: Name becomes editable input
- [ ] Change to: "Custom Chat Name"
- [ ] Press Enter
- [ ] **Expected**:
  - Header shows new name
  - Sidebar updates to show new name
- [ ] Press Escape while editing
- [ ] **Expected**: Edit cancelled, original name restored

### 1.20 Model Selection (Chat Mode)
**Steps:**
- [ ] Ensure mode is "Chat" (not Image or Video)
- [ ] Click on model dropdown (shows "ChatGPT 4o")
- [ ] **Expected**: Dropdown opens showing:
  - ChatGPT 4o
  - ChatGPT 5 (with "Neu" badge)
  - Claude 3.5
  - Gemini 2.0
- [ ] Select "ChatGPT 5"
- [ ] **Expected**: Dropdown closes, shows "ChatGPT 5"
- [ ] Send a message
- [ ] **Check Network**: Request goes to `/api/chat` with `gptModel: "gpt-5"`
- [ ] Switch to Claude
- [ ] Send message
- [ ] **Expected**: Different model response style
- [ ] **Note**: Model selection only visible in Chat mode

### 1.21 Stop Generation
**Steps:**
- [ ] Send a long message that will take time to generate
- [ ] While AI is streaming response
- [ ] Click "Stop" button (appears during generation)
- [ ] **Expected**:
  - Generation stops immediately
  - Partial response is visible
  - Input becomes available again
- [ ] **Check Console**: No errors (AbortError is normal)
- [ ] Send another message
- [ ] **Expected**: New message works normally

### 1.22 Long Message Scrolling
**Steps:**
- [ ] Send message asking for long response: "Write a 500-word essay"
- [ ] While response streams in
- [ ] **Expected**: Page auto-scrolls to bottom smoothly
- [ ] Scroll up manually during streaming
- [ ] **Expected**: Auto-scroll stops (user took control)
- [ ] Scroll near bottom (within 100px)
- [ ] **Expected**: Auto-scroll resumes
- [ ] After response completes, send another message
- [ ] **Expected**: Scrolls to new message

### 1.23 Message Persistence After Reload
**Steps:**
- [ ] Send several messages with different content types:
  - Text message
  - Message with image
  - Message with PDF
  - Reply to a message
- [ ] Hard reload page (Cmd+Shift+R / Ctrl+Shift+R)
- [ ] **Expected**:
  - All messages reload from Supabase
  - Images load from Supabase URLs (not base64)
  - PDFs show correct attachment
  - Reply relationships preserved
  - Message order correct
  - Timestamps accurate
- [ ] **Check Console**: No "undefined" or "null" errors
- [ ] **Check Network**: Images load from Supabase storage

### 1.24 Empty State
**Steps:**
- [ ] Click "New Chat"
- [ ] **Expected**:
  - Welcome screen shows
  - Example prompts displayed
  - "Send your first message" or similar text
- [ ] Click on an example prompt
- [ ] **Expected**: Prompt populates input and sends automatically
- [ ] **Visual Check**: Empty state is visually appealing

---

## 2. IMAGE GENERATION FUNCTIONALITY

### 2.1 Switch to Image Mode
**Steps:**
- [ ] Click plus (+) icon in chat input
- [ ] **Expected**: Dropdown menu opens showing modes
- [ ] Click "Generate Image" (or image icon)
- [ ] **Expected**:
  - Mode switches to Image
  - Header shows "Payperwork Flash v.1" (model locked)
  - Image settings panel appears above input
  - Model dropdown becomes disabled
- [ ] **Visual Check**: Image settings show aspect ratio, style, quality options

### 2.2 Generate Image from Text Prompt
**Steps:**
- [ ] Ensure mode is "Image"
- [ ] Type prompt: "A futuristic cityscape at sunset"
- [ ] Verify settings: Aspect ratio 16:9, Style: Realistic
- [ ] Click Send
- [ ] **Expected**:
  - User message appears with prompt
  - Assistant message shows loading indicator
  - "Generating image..." placeholder
  - Progress indicator if multiple retries (attempt 1/3)
- [ ] Wait for generation (15-30 seconds)
- [ ] **Expected**:
  - Generated image appears in assistant message
  - Image is high quality
  - Image matches prompt description
  - No placeholder text remains
- [ ] **Check Console**: No errors
- [ ] **Check Network**:
  - POST to `/api/generate-image` succeeds
  - POST to `/api/upload-chat-image` succeeds
  - Final image URL is from Supabase
- [ ] **Check Library**: Image automatically saved to library

### 2.3 Generate Multiple Images
**Steps:**
- [ ] In Image mode
- [ ] Type prompt: "A cute cat"
- [ ] In settings, if available, select "Generate 4 images" or similar
- [ ] Send
- [ ] **Expected**:
  - 4 separate images generate
  - All images appear in single assistant message
  - Grid layout for multiple images
  - All saved to library
- [ ] **Check**: Each image is unique variation

### 2.4 Image Settings - Aspect Ratio
**Steps:**
- [ ] In Image mode, locate aspect ratio dropdown
- [ ] **Expected**: Options like 1:1, 16:9, 9:16, 4:3
- [ ] Select "9:16" (portrait)
- [ ] Generate image with prompt: "A tall tower"
- [ ] **Expected**: Image is portrait orientation
- [ ] Select "16:9" (landscape)
- [ ] Generate: "A wide landscape"
- [ ] **Expected**: Image is landscape orientation
- [ ] **Visual Check**: Aspect ratios are correct

### 2.5 Image Settings - Style
**Steps:**
- [ ] Locate style dropdown in image settings
- [ ] **Expected**: Options like Realistic, Artistic, Anime, etc.
- [ ] Select "Anime" style
- [ ] Generate: "A warrior character"
- [ ] **Expected**: Image has anime/cartoon style
- [ ] Select "Realistic" style
- [ ] Generate: "A forest scene"
- [ ] **Expected**: Photorealistic image
- [ ] **Check**: Style setting affects output

### 2.6 Image Settings - Quality
**Steps:**
- [ ] Locate quality/detail setting
- [ ] **Expected**: Options like Standard, High, Ultra
- [ ] Select "High" quality
- [ ] Generate complex prompt: "A detailed mechanical watch"
- [ ] **Expected**:
  - Image has fine details
  - Higher resolution
  - May take longer to generate
- [ ] **Visual Check**: Compare quality with standard generation

### 2.7 Image Generation with Reference Image
**Steps:**
- [ ] In Image mode
- [ ] Upload a reference image (e.g., a person's face)
- [ ] Add prompt: "Same person wearing a space suit"
- [ ] Send
- [ ] **Expected**:
  - AI uses reference image for character consistency
  - Generated image maintains face features
  - Applies prompt modifications
- [ ] **Check Console**: referenceImages sent to API
- [ ] **Check Network**: Image is base64 encoded in request

### 2.8 Image Generation - Reply for Variations
**Steps:**
- [ ] Generate an image
- [ ] Hover over generated image message
- [ ] Click Reply
- [ ] Type: "Make it more colorful"
- [ ] Send
- [ ] **Expected**:
  - New image generated
  - Uses previous image as reference
  - Applies new modifications
- [ ] Try multiple iterations
- [ ] **Expected**: Each builds on previous

### 2.9 Image Generation - Retry on Failure
**Steps:**
- [ ] (Simulate by disconnecting internet or stopping API)
- [ ] Generate image
- [ ] **Expected**:
  - First attempt fails
  - Automatically retries (shows "Attempt 2/3")
  - Exponential backoff between retries
- [ ] If all retries fail
- [ ] **Expected**: Error message shown with retry option
- [ ] **Check Console**: Retry logic logs visible

### 2.10 Image Actions - Click to Enlarge
**Steps:**
- [ ] Click on any generated image in chat
- [ ] **Expected**:
  - Lightbox modal opens
  - Image shown at full resolution
  - Black overlay background
  - Close button (X) visible
- [ ] Click outside image or press Escape
- [ ] **Expected**: Lightbox closes
- [ ] Use arrow keys (if multiple images)
- [ ] **Expected**: Navigate between images

### 2.11 Image Actions - Download
**Steps:**
- [ ] Hover over generated image
- [ ] Click Download icon/button
- [ ] **Expected**:
  - Download starts
  - File saves with format: `payperwork-YYYY-MM-DD-HH-MM-SS-1.png`
  - File opens in image viewer correctly
- [ ] **Check**: Downloaded file is full resolution

### 2.12 Image Actions - Save to Library
**Steps:**
- [ ] After image generates
- [ ] **Expected**: Automatically saved to library (no manual action needed)
- [ ] Navigate to `/library`
- [ ] **Expected**: Generated image appears in library
- [ ] **Check**: Image has correct metadata (prompt, model, timestamp)

### 2.13 Switch Back to Chat Mode
**Steps:**
- [ ] In Image mode
- [ ] Click plus (+) icon or mode switcher
- [ ] Select "Chat"
- [ ] **Expected**:
  - Image settings panel disappears
  - Model dropdown becomes active again
  - Previous chat mode settings restored
- [ ] Send a text message
- [ ] **Expected**: Normal chat response (not image generation)

---

## 3. VIDEO GENERATION FUNCTIONALITY

### 3.1 Switch to Video Mode
**Steps:**
- [ ] Click plus (+) icon in input
- [ ] Select "Generate Video" (or video icon)
- [ ] **Expected**:
  - Mode switches to Video
  - Header shows "Payperwork Move v.1" or "v.2" (model dropdown active)
  - Video settings panel appears
  - Settings show: Duration, Aspect Ratio, Camera Movement (v1), Audio (v2)
- [ ] **Visual Check**: Video settings UI is clear

### 3.2 Video Model Selection
**Steps:**
- [ ] In Video mode, click model dropdown in header
- [ ] **Expected**: Shows:
  - Payperwork Move v.1 (Kling AI)
  - Payperwork Move v.2 (Sora 2)
- [ ] Select v.1
- [ ] **Expected**:
  - Settings show Camera Movement options
  - Duration options: 5s, 10s
  - Mode: Standard/Pro
- [ ] Select v.2
- [ ] **Expected**:
  - Settings show Audio toggle
  - Duration options: 5s (or model-specific)
  - No camera movement (not supported)

### 3.3 Generate Video from Text (Text2Video)
**Steps:**
- [ ] In Video mode (v.1 selected)
- [ ] Ensure NO image attached
- [ ] Type prompt: "A bird flying through clouds"
- [ ] Set Duration: 5s
- [ ] Set Camera Movement: "Zoom In"
- [ ] Click Send
- [ ] **Expected**:
  - User message appears
  - Assistant message shows:
    - Video placeholder with play icon
    - Progress bar (0%)
    - "Video wird generiert..." text
    - Estimated time remaining
- [ ] **Check**: Video appears in queue panel (bottom-right)
- [ ] **Expected Queue Panel**:
  - Shows video thumbnail or placeholder
  - Shows progress percentage
  - Shows estimated time
  - Status: "Processing"
- [ ] Wait for completion (3-5 minutes for v1, 1-2 min for v2)
- [ ] **Expected**:
  - Progress updates in real-time
  - Video placeholder updates to actual video
  - Video plays when clicked
  - Success message: "Video wurde erfolgreich generiert!"
  - Queue item status: "Succeed" (green checkmark)
- [ ] **Check Console**: No errors during polling
- [ ] **Check Network**:
  - POST to `/api/generate-video` succeeds
  - Polling requests to check video status
- [ ] **Check Library**: Video saved automatically

### 3.4 Generate Video from Image (Image2Video)
**Steps:**
- [ ] In Video mode
- [ ] Upload an image (e.g., a landscape photo)
- [ ] Type prompt: "Camera pans across the scene"
- [ ] Set Duration: 5s
- [ ] Send
- [ ] **Expected**:
  - User message shows image + prompt
  - Video generation starts from image
  - Thumbnail in queue shows uploaded image
- [ ] Wait for completion
- [ ] **Expected**:
  - Generated video animates from static image
  - Movement follows prompt description
- [ ] **Visual Check**: Video quality is good, no artifacts

### 3.5 Video Settings - Duration
**Steps:**
- [ ] In Video mode (v.1)
- [ ] Locate Duration dropdown
- [ ] **Expected**: Options 5s, 10s
- [ ] Select 10s
- [ ] Generate video
- [ ] **Expected**:
  - Video is 10 seconds long
  - Generation takes longer (~2x time)
- [ ] Switch to v.2 model
- [ ] **Expected**: Duration options may differ (model-specific)
- [ ] **Check**: Actual video duration matches setting

### 3.6 Video Settings - Aspect Ratio
**Steps:**
- [ ] Locate Aspect Ratio dropdown
- [ ] **Expected**: Options like 16:9, 9:16, 1:1
- [ ] Select 9:16 (portrait)
- [ ] Generate video
- [ ] **Expected**: Video is portrait orientation
- [ ] Select 16:9 (landscape)
- [ ] Generate video
- [ ] **Expected**: Video is landscape
- [ ] **Visual Check**: Videos play with correct aspect ratio

### 3.7 Video Settings - Camera Movement (v1 only)
**Steps:**
- [ ] Select Video model v.1
- [ ] Locate Camera Movement dropdown
- [ ] **Expected**: Options like:
  - None
  - Zoom In
  - Zoom Out
  - Pan Left
  - Pan Right
  - Tilt Up
  - Tilt Down
- [ ] Select "Zoom In"
- [ ] Generate video: "A flower"
- [ ] **Expected**: Video zooms into the flower
- [ ] Try different movements
- [ ] **Expected**: Each produces different camera motion
- [ ] **Note**: Camera movement auto-added to prompt

### 3.8 Video Settings - Audio Toggle (v2 only)
**Steps:**
- [ ] Select Video model v.2
- [ ] Locate Audio toggle
- [ ] Enable audio
- [ ] Generate video
- [ ] **Expected**: Video includes generated audio/sound effects
- [ ] Disable audio
- [ ] Generate video
- [ ] **Expected**: Video is silent
- [ ] **Check**: Audio plays correctly in video player

### 3.9 Video Settings - Mode (v1: Standard vs Pro)
**Steps:**
- [ ] Select Video model v.1
- [ ] Locate Mode setting
- [ ] **Expected**: Options: Standard, Pro
- [ ] Select "Pro"
- [ ] **Expected**:
  - May show "longer generation time" note
  - Higher quality expected
- [ ] Generate video
- [ ] Compare with Standard mode generation
- [ ] **Visual Check**: Pro mode has better quality/detail

### 3.10 Video Queue Panel - UI
**Steps:**
- [ ] Generate 2-3 videos
- [ ] **Expected**: Queue panel appears bottom-right
- [ ] **Check Panel Contains**:
  - Header with count "Videos (3)"
  - Status badges: Processing (spinner), Succeed (green), Failed (red)
  - Minimize/maximize toggle
- [ ] Click header to minimize
- [ ] **Expected**: Panel collapses, only header visible
- [ ] Click header again
- [ ] **Expected**: Panel expands, shows all queue items
- [ ] **Visual Check**: Panel doesn't overlap important UI

### 3.11 Video Queue - Progress Tracking
**Steps:**
- [ ] Start video generation
- [ ] Watch queue item
- [ ] **Expected**:
  - Progress bar animates from 0% to 100%
  - Percentage text updates
  - Estimated time counts down
  - Elapsed time counts up
  - Status stays "Processing" until done
- [ ] **Check**: Progress feels realistic (not instant jumps)
- [ ] When complete
- [ ] **Expected**:
  - Progress reaches 100%
  - Status changes to "Succeed"
  - Green checkmark icon appears

### 3.12 Video Queue - Click to Jump to Message
**Steps:**
- [ ] Generate multiple videos
- [ ] Scroll up in chat (away from latest video)
- [ ] Click on a queue item
- [ ] **Expected**:
  - Chat scrolls to that video's message
  - Message briefly highlights (yellow background)
- [ ] **Check**: Correct message is focused

### 3.13 Video Queue - Notifications
**Steps:**
- [ ] Start a long video generation
- [ ] Switch to another browser tab
- [ ] Wait for video to complete
- [ ] **Expected**:
  - Browser notification: "Video generation complete!"
  - (May require notification permission)
- [ ] Click notification
- [ ] **Expected**: Returns to Payperwork tab
- [ ] **Note**: May need to allow notifications first time

### 3.14 Video Playback - In-Chat Player
**Steps:**
- [ ] Generate and wait for video
- [ ] Click on video in message
- [ ] **Expected**:
  - Video plays inline
  - Player controls appear (play/pause, volume, fullscreen)
  - Video loops or shows replay option
- [ ] Click play/pause
- [ ] **Expected**: Controls work correctly
- [ ] Adjust volume
- [ ] **Expected**: Volume changes
- [ ] Click fullscreen
- [ ] **Expected**: Video plays fullscreen
- [ ] **Check**: No playback errors or stuttering

### 3.15 Video Playback - Lightbox
**Steps:**
- [ ] Click on video (or separate lightbox button)
- [ ] **Expected**:
  - Lightbox modal opens
  - Video plays at larger size
  - Controls available
  - Close button (X) visible
- [ ] Press Escape or click X
- [ ] **Expected**: Lightbox closes
- [ ] **Visual Check**: Video quality good at larger size

### 3.16 Video Actions - Download
**Steps:**
- [ ] Hover over completed video
- [ ] Click Download button/icon
- [ ] **Expected**:
  - Download starts
  - File saves as: `payperwork-YYYY-MM-DD-HH-MM-SS.mp4`
  - File plays correctly in video player
- [ ] **Check**: Downloaded video is full quality

### 3.17 Video Actions - Save to Library
**Steps:**
- [ ] After video generates
- [ ] **Expected**: Automatically saved to library
- [ ] Navigate to `/library`
- [ ] Filter by "Videos"
- [ ] **Expected**: Generated video appears
- [ ] **Check Metadata**: Prompt, model, duration, aspect ratio saved

### 3.18 Video Generation - Error Handling
**Steps:**
- [ ] (Simulate error: invalid API key or network issue)
- [ ] Generate video
- [ ] **Expected**:
  - Error message appears in message
  - Queue item shows "Failed" status (red X)
  - Error description shown
- [ ] **Check Console**: Error logged with details
- [ ] Click Retry (if available)
- [ ] **Expected**: New generation attempt starts

### 3.19 Video Generation - Multiple Concurrent
**Steps:**
- [ ] Start video generation 1
- [ ] Immediately start video generation 2
- [ ] Start video generation 3
- [ ] **Expected**:
  - All 3 appear in queue
  - All process in parallel
  - Progress updates independently for each
  - No interference between them
- [ ] **Check Queue**: Shows 3 processing items
- [ ] Wait for all to complete
- [ ] **Expected**: All complete successfully

### 3.20 Video Cache
**Steps:**
- [ ] Generate a video and wait for completion
- [ ] Scroll up so video is off-screen
- [ ] Scroll back down to video
- [ ] **Expected**: Video loads instantly (from cache)
- [ ] Reload page
- [ ] **Expected**:
  - Video URLs persist
  - Video plays without re-generation
- [ ] **Check Console**: Cache hit/miss logs

### 3.21 Switch Back to Chat Mode
**Steps:**
- [ ] In Video mode
- [ ] Switch to Chat mode
- [ ] **Expected**:
  - Video settings disappear
  - Normal chat mode active
- [ ] Send text message
- [ ] **Expected**: Text response (not video generation)
- [ ] Switch back to Video mode
- [ ] **Expected**: Previous video settings restored

---

## 4. SKETCH-TO-RENDER WORKFLOW

### 4.1 Navigate to Workflow
**Steps:**
- [ ] Click "Workflows" in sidebar
- [ ] Click "Sketch to Render" or navigate to `/workflows/sketch-to-render`
- [ ] **Expected**:
  - Workflow page loads
  - Shows 3 panels: Inputs, Input Images, Results
  - Input panel is empty initially
- [ ] **Visual Check**: Layout is clean and intuitive

### 4.2 Upload Source Sketch
**Steps:**
- [ ] In "Input Images" panel, click "Upload Source Image"
- [ ] Select an architectural sketch or wireframe image
- [ ] **Expected**:
  - Image preview appears
  - Shows filename
  - Edit and Delete buttons available
- [ ] Click Delete (X)
- [ ] **Expected**: Image is removed
- [ ] Upload again
- [ ] **Check**: Image persists in session

### 4.3 Upload Reference Images
**Steps:**
- [ ] Click "Add Reference Images"
- [ ] Select 1-2 style reference images
- [ ] **Expected**:
  - References appear in grid below source
  - Can upload multiple
  - Each has Delete button
- [ ] Delete one reference
- [ ] **Expected**: Only that reference removed
- [ ] Upload different reference
- [ ] **Expected**: Added to collection

### 4.4 Crop Source Image
**Steps:**
- [ ] Upload source sketch
- [ ] Click Edit icon on source image
- [ ] **Expected**: Crop modal opens
- [ ] Select crop area
- [ ] Click "Crop"
- [ ] **Expected**:
  - Preview shows cropped version
  - Original preserved for re-editing
- [ ] Click Edit again
- [ ] **Expected**: Shows original, can re-crop

### 4.5 Generate Render Prompt (Auto-Enhance)
**Steps:**
- [ ] With source image uploaded
- [ ] Click "Generate Prompt" or sparkle icon
- [ ] **Expected**:
  - Button shows loading
  - AI analyzes image
  - Auto-generated prompt appears in textarea
- [ ] Review prompt
- [ ] **Expected**: Prompt describes sketch architecture style
- [ ] Edit prompt manually if desired
- [ ] **Check Console**: POST to prompt enhancement API succeeds

### 4.6 Manual Prompt Entry
**Steps:**
- [ ] In prompt field, type: "Modern house with glass facade"
- [ ] **Expected**: Text appears normally
- [ ] **Check**: Manual input works without enhancement

### 4.7 Render Settings Configuration
**Steps:**
- [ ] Locate render settings panel/section
- [ ] **Expected**: Settings include:
  - Aspect Ratio
  - Style/Preset
  - Detail Level
  - Structure Preservation (strength)
- [ ] Change aspect ratio to 16:9
- [ ] Change style to "Realistic"
- [ ] Adjust structure preservation to 0.7
- [ ] **Check**: Settings UI is responsive

### 4.8 Generate Render (from Sketch)
**Steps:**
- [ ] With source image and prompt ready
- [ ] Click "Generate Render"
- [ ] **Expected**:
  - Loading indicator shows
  - Progress bar if available
  - "Generating render with Nano Banana..." text
- [ ] Wait 15-30 seconds
- [ ] **Expected**:
  - Rendered image appears in Results panel
  - Shows auto-generated name: `payperwork-sketchtorender-YYYYMMDD-HHMMSS-####`
  - Original sketch visible (for comparison)
- [ ] **Check Console**: POST to `/api/sketch-to-render/generate` or similar
- [ ] **Visual Check**:
  - Render maintains sketch structure
  - Applies realistic styling
  - Good quality

### 4.9 View in Lightbox
**Steps:**
- [ ] Click on generated render in Results panel
- [ ] **Expected**:
  - Lightbox opens
  - Shows rendered image at full size
  - **IMPORTANT**: Shows source sketch side-by-side or as overlay
  - Toggle or slider to compare before/after
- [ ] Use compare toggle/slider
- [ ] **Expected**: Easy to see source vs render
- [ ] Press Escape or click Close
- [ ] **Expected**: Lightbox closes

### 4.10 Edit Render (Structure Preservation)
**Steps:**
- [ ] With render generated, click "Edit" button
- [ ] **Expected**:
  - Render becomes new source
  - Can adjust prompt
  - Can adjust structure preservation strength
- [ ] Change prompt to: "Add more greenery around building"
- [ ] Lower structure preservation to 0.5 (less strict)
- [ ] Click "Generate"
- [ ] **Expected**:
  - New render generated
  - Uses previous render as base
  - Applies modifications
  - New auto-generated name
- [ ] **Check**: Can iterate multiple times
- [ ] **Visual Check**: Each edit builds on previous

### 4.11 Upscale Render (Freepik)
**Steps:**
- [ ] With render generated, click "Upscale" button
- [ ] **Expected**:
  - Loading indicator
  - "Upscaling with Freepik..." text
- [ ] Wait 20-40 seconds
- [ ] **Expected**:
  - Upscaled version appears
  - Higher resolution
  - Better detail/quality
  - New auto-generated name
  - Marked as "upscale" type
- [ ] Click to view full size
- [ ] **Expected**: Noticeably higher resolution
- [ ] Compare with original render
- [ ] **Visual Check**: Quality improvement visible
- [ ] **Check Console**: POST to upscale API succeeds

### 4.12 Generate Video from Render (Runway)
**Steps:**
- [ ] With render or upscaled image, click "Generate Video"
- [ ] **Expected**:
  - Video settings appear (duration, etc.)
- [ ] Set duration to 5s
- [ ] Optional: Add camera movement prompt
- [ ] Click "Generate Video"
- [ ] **Expected**:
  - Video generation starts
  - Shows progress
  - "Generating video with Runway Gen4 Turbo..."
- [ ] Wait 2-5 minutes
- [ ] **Expected**:
  - Video appears in results
  - Plays when clicked
  - Auto-generated name
  - Marked as "video" type
- [ ] **Check**: Video shows render with subtle motion/animation
- [ ] **Visual Check**: No flickering or artifacts

### 4.13 Download Render
**Steps:**
- [ ] Hover over any generated render
- [ ] Click Download icon
- [ ] **Expected**:
  - Download starts
  - Filename matches auto-generated name
  - File is PNG at full resolution
- [ ] Open downloaded file
- [ ] **Check**: Image is correct and full quality

### 4.14 Download Video
**Steps:**
- [ ] Hover over generated video in workflow
- [ ] Click Download
- [ ] **Expected**:
  - MP4 file downloads
  - Correct filename
- [ ] Play downloaded video
- [ ] **Check**: Video plays correctly offline

### 4.15 Delete Generation
**Steps:**
- [ ] Hover over any render/video in recent generations
- [ ] Click Delete icon/button
- [ ] **Expected**: Confirmation dialog appears
- [ ] Click "Cancel"
- [ ] **Expected**: Item still exists
- [ ] Delete again, click "Confirm"
- [ ] **Expected**:
  - Item removed from recent generations
  - Results panel updates
- [ ] Reload page
- [ ] **Expected**: Deleted item doesn't reappear

### 4.16 Recent Generations List
**Steps:**
- [ ] Generate 3-4 renders/videos
- [ ] **Expected**: Recent generations panel shows all
- [ ] **Check List Shows**:
  - Thumbnail preview
  - Type badge (render/video/upscale)
  - Timestamp
  - Auto-generated name
- [ ] Click on item in recent generations
- [ ] **Expected**: Loads in results panel or opens lightbox
- [ ] **Check**: List sorted by newest first

### 4.17 Generation Metadata
**Steps:**
- [ ] Click on any generation in recent list
- [ ] View details panel or metadata
- [ ] **Expected Shows**:
  - Original prompt used
  - Render settings (aspect ratio, style, etc.)
  - Source type (original/from_render/from_video)
  - Model used (Nano Banana, Runway, etc.)
  - Timestamp
- [ ] **Check**: All metadata accurate

### 4.18 Database Persistence
**Steps:**
- [ ] Generate render with specific name/prompt
- [ ] Close browser completely
- [ ] Reopen and navigate to workflow
- [ ] **Expected**: Recent generations load from database
- [ ] **Check**: All metadata persists correctly
- [ ] Click on generation
- [ ] **Expected**: Image/video still accessible

### 4.19 Workflow - Clear Inputs
**Steps:**
- [ ] Upload images and enter prompt
- [ ] Generate render
- [ ] **Expected**: Inputs are automatically cleared after successful generation
- [ ] **Check**:
  - Prompt field is empty
  - Source image cleared (or optional: kept for next iteration)
  - Settings reset to defaults
- [ ] Can immediately start new generation

### 4.20 Error Handling - No Source Image
**Steps:**
- [ ] Don't upload source image
- [ ] Enter prompt
- [ ] Click "Generate Render"
- [ ] **Expected**: Error message "Please upload a source image first"
- [ ] **Check**: Generation doesn't start

### 4.21 Error Handling - Empty Prompt
**Steps:**
- [ ] Upload source image
- [ ] Leave prompt empty
- [ ] Click "Generate"
- [ ] **Expected**: Error or prompt to enter description
- [ ] **Check**: Validation works

### 4.22 Error Handling - API Failure
**Steps:**
- [ ] (Simulate: invalid API key or network error)
- [ ] Attempt generation
- [ ] **Expected**:
  - Error message appears
  - Describes issue
  - Retry option if applicable
- [ ] **Check Console**: Error logged with details

---

## 5. LIBRARY FUNCTIONALITY

### 5.1 Navigate to Library
**Steps:**
- [ ] Click "Library" in sidebar or navigate to `/library`
- [ ] **Expected**:
  - Library page loads
  - Shows grid of all media (images + videos)
  - Header with tabs: All, Videos, Images, Favorites
  - Search bar
  - Sort dropdown
- [ ] **Check**: All previously generated media appears

### 5.2 Tab Filtering
**Steps:**
- [ ] Click "Videos" tab
- [ ] **Expected**: Only video items shown
- [ ] Click "Images" tab
- [ ] **Expected**: Only image items shown
- [ ] Click "Favorites" tab
- [ ] **Expected**: Only favorited items shown (may be empty)
- [ ] Click "All" tab
- [ ] **Expected**: All media types shown
- [ ] **Check**: Counts in tabs are accurate

### 5.3 Unseen Indicator
**Steps:**
- [ ] Generate new media (image or video)
- [ ] Navigate to Library
- [ ] **Expected**:
  - New item has "unseen" badge/indicator
  - Tab shows unseen count badge (e.g., "Videos (3)" with dot)
- [ ] Click on unseen item
- [ ] **Expected**:
  - Indicator disappears
  - Unseen count decreases
- [ ] Navigate away and back
- [ ] **Expected**: Previously seen item stays marked as seen

### 5.4 Search Functionality
**Steps:**
- [ ] In search bar, type: "city" (or any keyword from prompts)
- [ ] **Expected**:
  - Results filter in real-time
  - Shows only items matching search term
  - Searches in prompt text
- [ ] Clear search
- [ ] **Expected**: All items reappear
- [ ] Try searching partial word: "cit"
- [ ] **Expected**: Still finds "city"
- [ ] Try searching model name: "Kling"
- [ ] **Expected**: Shows items generated with that model

### 5.5 Sort Options
**Steps:**
- [ ] Click Sort dropdown
- [ ] **Expected**: Options: Newest, Oldest, Name
- [ ] Select "Newest"
- [ ] **Expected**: Items sorted by creation date (newest first)
- [ ] Select "Oldest"
- [ ] **Expected**: Order reverses (oldest first)
- [ ] Select "Name"
- [ ] **Expected**: Alphabetical order by filename
- [ ] **Check**: Sorting persists on page reload

### 5.6 Grid Layout
**Steps:**
- [ ] View library grid
- [ ] **Expected**:
  - Responsive grid (more columns on wider screens)
  - Images show thumbnail
  - Videos show thumbnail with play icon overlay
  - Hover shows additional controls
- [ ] Resize browser window
- [ ] **Expected**: Grid adjusts column count responsively
- [ ] **Visual Check**: Grid is visually balanced

### 5.7 Media Card - Hover Actions
**Steps:**
- [ ] Hover over any media card
- [ ] **Expected**: Action buttons appear:
  - Play (for videos)
  - Download
  - Favorite/Unfavorite
  - Delete
  - More info/metadata
- [ ] Move mouse away
- [ ] **Expected**: Actions fade out
- [ ] **Visual Check**: Hover state is smooth

### 5.8 Mark as Favorite
**Steps:**
- [ ] Hover over media card
- [ ] Click heart/star icon (favorite)
- [ ] **Expected**:
  - Icon fills in (becomes solid)
  - Item added to Favorites
- [ ] Click "Favorites" tab
- [ ] **Expected**: Item appears there
- [ ] Click favorite icon again (unfavorite)
- [ ] **Expected**:
  - Icon becomes outline
  - Item removed from Favorites tab
- [ ] **Check Database**: Favorite status persists

### 5.9 View Media in Lightbox
**Steps:**
- [ ] Click on any image card
- [ ] **Expected**:
  - Lightbox opens
  - Image shown at full resolution
  - Metadata sidebar (or overlay) shows:
    - Filename
    - Prompt used
    - Model name
    - Timestamp
    - Dimensions/duration
- [ ] Press Escape or click Close
- [ ] **Expected**: Returns to library grid
- [ ] Click on video card
- [ ] **Expected**:
  - Lightbox opens
  - Video plays
  - Controls available
  - Metadata shown

### 5.10 Lightbox Navigation
**Steps:**
- [ ] Open any item in lightbox
- [ ] **Expected**: Arrow buttons or keyboard arrows enabled
- [ ] Press Right Arrow key
- [ ] **Expected**: Moves to next item in library
- [ ] Press Left Arrow key
- [ ] **Expected**: Moves to previous item
- [ ] At last item, press Right Arrow
- [ ] **Expected**: Wraps to first item (or disables)
- [ ] **Check**: Navigation order matches grid order

### 5.11 Download Single Item
**Steps:**
- [ ] Hover over media card
- [ ] Click Download button
- [ ] **Expected**:
  - Download starts immediately
  - File saves with correct name
  - PNG for images, MP4 for videos
- [ ] Open downloaded file
- [ ] **Check**: File is correct and full quality

### 5.12 Selection Mode - Enter
**Steps:**
- [ ] Click "Select" button in library header
- [ ] **Expected**:
  - Selection mode activates
  - Checkboxes appear on all cards
  - Selection action bar appears at top
  - "Cancel" or "Done" button visible
- [ ] **Visual Check**: UI clearly shows selection mode is active

### 5.13 Selection Mode - Select Items
**Steps:**
- [ ] In selection mode, click on 3 different media cards
- [ ] **Expected**:
  - Checkbox checks
  - Card highlights (blue border or overlay)
  - Count updates in action bar: "3 selected"
- [ ] Click selected item again
- [ ] **Expected**: Deselects (checkbox unchecks)
- [ ] **Check**: Selected count accurate

### 5.14 Selection Mode - Select All
**Steps:**
- [ ] In selection mode, click "Select All" in action bar
- [ ] **Expected**:
  - All visible items selected
  - Checkboxes all checked
  - Count shows total: "27 selected" (or actual total)
- [ ] **Check**: Filtered items (if search active) all selected

### 5.15 Selection Mode - Deselect All
**Steps:**
- [ ] With items selected, click "Deselect All"
- [ ] **Expected**:
  - All checkboxes uncheck
  - Count shows "0 selected"
  - Cards unhighlight

### 5.16 Bulk Download
**Steps:**
- [ ] Select 3-5 items (mix of images and videos)
- [ ] Click "Download" button in action bar
- [ ] **Expected**:
  - Loading indicator shows
  - All files download (may be as ZIP or individual downloads)
  - Success message or toast
- [ ] Check downloads folder
- [ ] **Expected**: All selected files present
- [ ] **Check**: Correct filenames and formats

### 5.17 Bulk Delete
**Steps:**
- [ ] Select 2-3 test items
- [ ] Click "Delete" button in action bar
- [ ] **Expected**: Confirmation dialog appears
  - Shows count: "Delete 3 items?"
  - Cancel and Confirm buttons
- [ ] Click "Cancel"
- [ ] **Expected**: Dialog closes, items still selected
- [ ] Click "Delete" again, then "Confirm"
- [ ] **Expected**:
  - Loading indicator
  - Items removed from library
  - Success message
  - Selection mode exits
  - Deleted items don't reappear on reload
- [ ] **Check Database**: Items deleted from Supabase
- [ ] **Check Storage**: Files deleted from Supabase storage

### 5.18 Selection Mode - Keyboard Shortcuts
**Steps:**
- [ ] Enter selection mode
- [ ] Press Ctrl+A (or Cmd+A on Mac)
- [ ] **Expected**: All items selected
- [ ] Select some items
- [ ] Press Delete key
- [ ] **Expected**: Delete confirmation dialog appears
- [ ] Press Escape
- [ ] **Expected**:
  - Dialog closes (if open)
  - OR exits selection mode
- [ ] **Check**: Keyboard shortcuts work consistently

### 5.19 Selection Mode - Exit
**Steps:**
- [ ] In selection mode with items selected
- [ ] Click "Cancel" or "Done" button
- [ ] **Expected**:
  - Selection mode exits
  - Checkboxes disappear
  - Selection action bar hides
  - All items deselected
- [ ] **Visual Check**: Returns to normal browse mode

### 5.20 Infinite Scroll / Load More
**Steps:**
- [ ] If library has many items (50+)
- [ ] Scroll to bottom of page
- [ ] **Expected**:
  - More items load automatically
  - Loading indicator shows briefly
  - Smooth scroll experience
- [ ] Continue scrolling
- [ ] **Expected**: Loads more until all items shown
- [ ] At end, shows "No more items" or similar
- [ ] **Performance Check**: Scrolling stays smooth

### 5.21 Empty State
**Steps:**
- [ ] In fresh install or test account with no media
- [ ] Navigate to Library
- [ ] **Expected**:
  - Empty state message: "No media yet"
  - Helpful text: "Generated images and videos appear here"
  - Call-to-action button: "Generate your first image"
- [ ] Click CTA button
- [ ] **Expected**: Navigates to chat or workflow

### 5.22 Error State - Failed to Load
**Steps:**
- [ ] (Simulate: disconnect internet or stop Supabase)
- [ ] Navigate to Library
- [ ] **Expected**:
  - Error message: "Failed to load library"
  - Retry button
- [ ] Click Retry
- [ ] **Expected**: Attempts to reload
- [ ] **Check Console**: Error logged

### 5.23 Video Playback in Grid
**Steps:**
- [ ] Hover over video card in grid
- [ ] **Expected**: Play button appears
- [ ] Click play button (not opening lightbox)
- [ ] **Expected**:
  - Video plays inline in grid
  - Can pause/play
  - Optional: hover to show controls
- [ ] Move mouse away
- [ ] **Expected**: Video continues or pauses

### 5.24 Media Metadata Panel
**Steps:**
- [ ] Click info icon on media card
- [ ] **Expected**: Metadata panel/modal opens showing:
  - Full filename
  - Full prompt text
  - Model name
  - Generation settings
  - File size
  - Dimensions (or duration for video)
  - Creation timestamp
  - Related generation (if from workflow)
- [ ] **Visual Check**: All info is readable and accurate

### 5.25 Navigate to Source Conversation
**Steps:**
- [ ] For media generated in chat (not workflow)
- [ ] Open metadata or right-click menu
- [ ] Click "View in Conversation" or similar
- [ ] **Expected**:
  - Navigates to `/chat`
  - Opens correct conversation
  - Scrolls to exact message with that media
  - Message highlights briefly
- [ ] **Check**: Correct conversation and message

### 5.26 Library Persistence
**Steps:**
- [ ] Note current library items and count
- [ ] Close browser completely
- [ ] Reopen and navigate to Library
- [ ] **Expected**:
  - All items reload from Supabase
  - Same order (based on sort setting)
  - Favorite status preserved
  - Seen/unseen status preserved
- [ ] **Check Database**: Data matches UI

---

## 6. SIDEBAR & NAVIGATION

### 6.1 Sidebar Collapse/Expand (Desktop)
**Steps:**
- [ ] On desktop (screen > 768px), locate collapse button in sidebar
- [ ] Click collapse button
- [ ] **Expected**:
  - Sidebar collapses to icon-only width (~60px)
  - Only icons visible
  - Text labels hidden
  - Main content area expands
- [ ] Click collapse button again
- [ ] **Expected**:
  - Sidebar expands to full width
  - Text labels reappear
- [ ] **Check**: Animation is smooth

### 6.2 Sidebar Mobile Behavior
**Steps:**
- [ ] Resize browser to mobile width (< 768px)
- [ ] **Expected**: Sidebar hidden by default
- [ ] Click hamburger menu icon in header
- [ ] **Expected**:
  - Sidebar slides in from left
  - Overlay darkens main content
  - Close button (X) visible
- [ ] Click overlay (outside sidebar)
- [ ] **Expected**: Sidebar closes
- [ ] Open sidebar, press Escape
- [ ] **Expected**: Sidebar closes

### 6.3 Navigation Section
**Steps:**
- [ ] In sidebar, locate Navigation section
- [ ] **Expected**: Shows links:
  - Chat (with icon)
  - Library (with icon and unseen count badge if applicable)
  - Workflows (with icon)
- [ ] Click "Chat"
- [ ] **Expected**: Navigates to `/chat`
- [ ] Click "Library"
- [ ] **Expected**: Navigates to `/library`
- [ ] Click "Workflows"
- [ ] **Expected**: Shows workflow submenu or navigates
- [ ] **Check**: Active page is highlighted

### 6.4 Workflows Submenu
**Steps:**
- [ ] Click "Workflows" in sidebar
- [ ] **Expected**: Submenu expands showing:
  - Sketch to Render
  - (Other workflows if any)
- [ ] Click "Sketch to Render"
- [ ] **Expected**: Navigates to `/workflows/sketch-to-render`
- [ ] Navigate elsewhere
- [ ] **Check**: Workflows submenu can collapse/expand

### 6.5 New Chat Button
**Steps:**
- [ ] From any page, click "New Chat" in sidebar
- [ ] **Expected**:
  - Navigates to `/chat`
  - Clears current conversation
  - Shows empty chat state
  - Input is focused
- [ ] **Check**: Previous conversation saved, not lost

### 6.6 Conversation List Scrolling
**Steps:**
- [ ] Create 20+ conversations
- [ ] **Expected**: Conversation list scrolls independently
- [ ] Scroll conversation list
- [ ] **Expected**:
  - Smooth scrolling
  - Header stays fixed
  - New Chat button stays accessible
- [ ] Scroll to bottom
- [ ] **Expected**: Can see oldest conversations

### 6.7 Sidebar Footer - Settings
**Steps:**
- [ ] Locate settings icon/button at bottom of sidebar
- [ ] Click settings
- [ ] **Expected**: Settings menu or page opens
- [ ] **Check**: Settings options appear (if implemented)

### 6.8 Sidebar Footer - Profile
**Steps:**
- [ ] Locate profile icon/button at bottom of sidebar
- [ ] Click profile
- [ ] **Expected**: Profile dropdown or page opens
- [ ] **Expected Options**:
  - User info
  - Account settings
  - Logout
- [ ] Click outside
- [ ] **Expected**: Dropdown closes

### 6.9 Sidebar Footer - Logout
**Steps:**
- [ ] Click profile → Logout
- [ ] **Expected**:
  - Confirmation dialog (optional)
  - Logs out of session
  - Redirects to login page or home
- [ ] **Check**: Cannot access protected pages after logout

### 6.10 Sidebar Persistence
**Steps:**
- [ ] Collapse sidebar on desktop
- [ ] Reload page
- [ ] **Expected**: Sidebar stays collapsed
- [ ] Expand sidebar
- [ ] Reload
- [ ] **Expected**: Sidebar stays expanded
- [ ] **Check**: State saved to localStorage

---

## 7. EDGE CASES & ERROR SCENARIOS

### 7.1 Long Message Handling
**Steps:**
- [ ] Type a very long message (1000+ characters)
- [ ] Send
- [ ] **Expected**:
  - Message accepts long input
  - Textarea auto-expands
  - Message displays correctly (may truncate with "Show more")
- [ ] **Check**: No UI breaking

### 7.2 Special Characters in Messages
**Steps:**
- [ ] Send message with: emojis, symbols, foreign characters (é, ñ, ü, etc.)
- [ ] **Expected**:
  - All characters display correctly
  - No encoding issues
  - Database stores correctly
- [ ] Reload page
- [ ] **Expected**: Special characters persist

### 7.3 Very Large Image Upload
**Steps:**
- [ ] Try uploading 10MB+ image
- [ ] **Expected**:
  - Upload may take longer (shows progress)
  - OR error if exceeds max size
  - Clear error message if rejected
- [ ] **Check**: Max size limit enforced

### 7.4 Invalid File Type Upload
**Steps:**
- [ ] Try uploading .txt, .zip, or other non-image/PDF file
- [ ] **Expected**: Error message "Invalid file type"
- [ ] **Check**: Only allowed types accepted

### 7.5 Network Disconnection During Generation
**Steps:**
- [ ] Start image or video generation
- [ ] Disconnect internet during generation
- [ ] **Expected**:
  - Error message after timeout
  - "Network error" or similar
  - Retry option available
- [ ] Reconnect internet
- [ ] Click retry
- [ ] **Expected**: Generation resumes or restarts

### 7.6 Browser Refresh During Generation
**Steps:**
- [ ] Start video generation (long process)
- [ ] Refresh page while generating
- [ ] **Expected**:
  - Generation continues on server
  - After reload, video queue restores
  - Progress resumes tracking
  - OR shows as failed with retry option
- [ ] **Check**: No data loss

### 7.7 Multiple Browser Tabs
**Steps:**
- [ ] Open Payperwork in two browser tabs
- [ ] In tab 1, send a message
- [ ] Switch to tab 2
- [ ] **Expected**: New message appears (if real-time sync implemented)
- [ ] OR reload tab 2 to see new message
- [ ] **Check**: No conflicts or duplicate data

### 7.8 Rapid Fire Messages
**Steps:**
- [ ] Send 5 messages very quickly (before AI responds)
- [ ] **Expected**:
  - All user messages appear
  - AI responds to each in order
  - No messages lost
  - No race conditions
- [ ] **Check Console**: No errors

### 7.9 Empty Message Attempt
**Steps:**
- [ ] With empty input, click Send
- [ ] **Expected**: Nothing happens (send disabled)
- [ ] Try sending only spaces "   "
- [ ] **Expected**: Treated as empty, send disabled
- [ ] **Check**: Validation works

### 7.10 Session Expiry
**Steps:**
- [ ] (If authentication implemented)
- [ ] Let session expire or manually clear cookies
- [ ] Try to send a message or navigate
- [ ] **Expected**:
  - Redirects to login
  - OR shows session expired message
  - OR refreshes auth token automatically
- [ ] Login again
- [ ] **Expected**: Can continue using app

### 7.11 Database Connection Failure
**Steps:**
- [ ] (Simulate: stop Supabase or invalid credentials)
- [ ] Try to load conversations or library
- [ ] **Expected**:
  - Error message: "Failed to connect to database"
  - Retry button
  - App doesn't crash
- [ ] **Check Console**: Error logged with details

### 7.12 API Rate Limiting
**Steps:**
- [ ] Send many rapid API requests (if rate limit exists)
- [ ] **Expected**:
  - Error message: "Rate limit exceeded, please wait"
  - Shows cooldown timer
  - Request queued or rejected gracefully
- [ ] Wait for cooldown
- [ ] **Expected**: Can send again

### 7.13 Concurrent Video Generations (Stress Test)
**Steps:**
- [ ] Start 5-10 video generations simultaneously
- [ ] **Expected**:
  - All appear in queue
  - All process (may be queued on server)
  - No crashes or hung requests
  - Progress tracks for each
- [ ] **Check Console**: No errors
- [ ] **Performance**: UI stays responsive

### 7.14 Browser Back Button
**Steps:**
- [ ] Navigate: Chat → Library → Workflow
- [ ] Click browser back button
- [ ] **Expected**: Returns to previous page (Library)
- [ ] Click back again
- [ ] **Expected**: Returns to Chat
- [ ] **Check**: State is preserved (messages still there)

### 7.15 Browser Forward Button
**Steps:**
- [ ] Navigate back, then click forward button
- [ ] **Expected**: Moves forward in history
- [ ] **Check**: Page state correct

### 7.16 Direct URL Access
**Steps:**
- [ ] Copy URL of a specific conversation: `/chat?convId=123456`
- [ ] Open in new tab or incognito
- [ ] **Expected**:
  - (If authenticated) Loads that conversation
  - (If not authenticated) Redirects to login, then to conversation
- [ ] Try invalid conversation ID
- [ ] **Expected**: Error or redirects to new chat

### 7.17 Slow Network Simulation
**Steps:**
- [ ] Use browser DevTools to throttle network (Slow 3G)
- [ ] Try uploading image
- [ ] **Expected**:
  - Upload takes longer
  - Progress indicator shows
  - No timeout errors (reasonable timeout like 60s)
- [ ] Try generating image/video
- [ ] **Expected**: Works but slower, shows progress

### 7.18 Console Error Check
**Steps:**
- [ ] Perform any 10 random actions
- [ ] **Check Console**:
  - No red errors
  - No 404s
  - No failed API calls
  - Warnings are acceptable (React warnings ok in dev)

### 7.19 Memory Leak Check (Long Session)
**Steps:**
- [ ] Use app for 30+ minutes
- [ ] Generate 20+ images/videos
- [ ] Open DevTools Performance monitor
- [ ] **Check**: Memory usage doesn't continuously increase
- [ ] **Check**: App stays responsive

### 7.20 Accessibility - Keyboard Navigation
**Steps:**
- [ ] Use only Tab key to navigate
- [ ] **Expected**: Can reach all interactive elements
- [ ] Press Enter on buttons
- [ ] **Expected**: Buttons activate
- [ ] Use arrow keys in dropdowns
- [ ] **Expected**: Dropdown navigation works
- [ ] Press Escape on modals
- [ ] **Expected**: Modals close

---

## 8. UI/UX CHECKS

### 8.1 Responsive Design - Mobile (320px - 480px)
**Steps:**
- [ ] Resize browser to 320px width (iPhone SE)
- [ ] **Check**:
  - All text readable (no overflow)
  - Buttons are tappable (min 44px)
  - Images scale correctly
  - No horizontal scroll
  - Sidebar becomes overlay
  - Input toolbar wraps properly
- [ ] Try all features on mobile size
- [ ] **Expected**: All functionality works

### 8.2 Responsive Design - Tablet (481px - 768px)
**Steps:**
- [ ] Resize to tablet width (768px)
- [ ] **Check**:
  - Layout adapts (may show sidebar or keep as overlay)
  - Grid layout adjusts column count
  - Touch targets are large enough
  - No UI elements overlap

### 8.3 Responsive Design - Desktop (769px+)
**Steps:**
- [ ] View at 1920px width
- [ ] **Check**:
  - Sidebar visible by default
  - Content doesn't stretch too wide (max-width applied)
  - Images/videos don't become too large
  - Whitespace balanced

### 8.4 Dark Mode (if implemented)
**Steps:**
- [ ] Toggle dark mode switch
- [ ] **Expected**:
  - All colors invert appropriately
  - Text remains readable (good contrast)
  - Images/videos display correctly
  - No white flashes
- [ ] Switch back to light mode
- [ ] **Expected**: Smooth transition

### 8.5 Loading States
**Steps:**
- [ ] Observe all loading indicators:
  - Message streaming
  - Image generation
  - Video generation
  - Library loading
  - Conversation loading
- [ ] **Check**: All have clear loading indicators (spinners, progress bars, skeleton screens)
- [ ] **Visual Check**: Loading states are polished

### 8.6 Empty States
**Steps:**
- [ ] Check empty states for:
  - New chat (no messages)
  - Library (no media)
  - Search with no results
  - Favorites tab with no favorites
- [ ] **Check**: All empty states have helpful text and/or CTAs

### 8.7 Button States
**Steps:**
- [ ] Check button states:
  - Default
  - Hover
  - Active (pressed)
  - Disabled
  - Loading
- [ ] **Visual Check**: All states have clear visual feedback

### 8.8 Form Validation
**Steps:**
- [ ] Try submitting forms with invalid/empty data
- [ ] **Expected**:
  - Clear error messages
  - Red borders or indicators
  - Error text near relevant field
  - Submit button disabled until valid

### 8.9 Toast Notifications
**Steps:**
- [ ] Trigger various notifications:
  - Success: "Image saved to library"
  - Error: "Generation failed"
  - Info: "Video generation started"
- [ ] **Check**:
  - Toasts appear in consistent location
  - Auto-dismiss after few seconds
  - Can manually dismiss
  - Don't stack too many (max 3-5)

### 8.10 Animations & Transitions
**Steps:**
- [ ] Observe animations:
  - Sidebar open/close
  - Modal open/close
  - Dropdown expand/collapse
  - Hover effects
  - Page transitions
- [ ] **Check**:
  - Smooth (60fps)
  - Not too slow (< 300ms)
  - Not too fast (> 100ms)
  - Respect prefers-reduced-motion

### 8.11 Typography
**Steps:**
- [ ] Check text throughout app:
  - Headings hierarchy (H1 > H2 > H3)
  - Body text size (14-16px)
  - Line height (1.5-1.7)
  - Font weights (regular, medium, bold)
- [ ] **Visual Check**: Typography is consistent and readable

### 8.12 Color Consistency
**Steps:**
- [ ] Check colors match design system:
  - Primary (pw-accent)
  - Background (pw-dark)
  - Text (pw-black with opacity variants)
  - Success (green)
  - Error (red)
  - Warning (yellow)
- [ ] **Check**: No random colors that break consistency

### 8.13 Icon Consistency
**Steps:**
- [ ] Check all icons:
  - Same style (Lucide icons)
  - Consistent size (usually 16px or 20px)
  - Proper alignment with text
- [ ] **Visual Check**: Icons enhance understanding

### 8.14 Accessibility - Alt Text
**Steps:**
- [ ] Inspect images in DOM
- [ ] **Check**: All images have descriptive alt text
- [ ] For generated images
- [ ] **Check**: Alt text uses prompt or description

### 8.15 Accessibility - ARIA Labels
**Steps:**
- [ ] Inspect buttons and icons (especially icon-only)
- [ ] **Check**: All have aria-label or aria-labelledby
- [ ] Use screen reader (optional)
- [ ] **Check**: Elements are properly announced

### 8.16 Performance - Page Load Time
**Steps:**
- [ ] Hard reload main pages
- [ ] **Expected**: Load in < 3 seconds
- [ ] Use Lighthouse in DevTools
- [ ] **Target Scores**:
  - Performance: > 80
  - Accessibility: > 90
  - Best Practices: > 80

### 8.17 Performance - Time to Interactive
**Steps:**
- [ ] Note when page becomes interactive
- [ ] **Expected**: Can interact within 2-3 seconds
- [ ] No long blocking tasks

### 8.18 Performance - Image Optimization
**Steps:**
- [ ] Check Network tab for image sizes
- [ ] **Expected**:
  - Thumbnails are compressed/resized
  - Full images lazy load
  - Uses modern formats (WebP if possible)

### 8.19 Browser Compatibility - Chrome
**Steps:**
- [ ] Test all features in Chrome
- [ ] **Expected**: Everything works perfectly

### 8.20 Browser Compatibility - Firefox
**Steps:**
- [ ] Test all features in Firefox
- [ ] **Expected**: Everything works (check for CSS differences)

### 8.21 Browser Compatibility - Safari
**Steps:**
- [ ] Test all features in Safari
- [ ] **Expected**: Everything works (Safari often has quirks)
- [ ] **Check**: Video playback works
- [ ] **Check**: WebGL/Canvas features work

### 8.22 Browser Compatibility - Mobile Safari (iOS)
**Steps:**
- [ ] Test on actual iPhone or simulator
- [ ] **Expected**:
  - Touch gestures work
  - No zoom issues (viewport meta tag correct)
  - Video inline playback works
  - File upload works

---

## 9. CRITICAL DATA INTEGRITY CHECKS

### 9.1 Message Order Preservation
**Steps:**
- [ ] Send 10 messages in specific order
- [ ] Reload page
- [ ] **Expected**: Messages in exact same order
- [ ] **Check Database**: timestamp order matches display order

### 9.2 Attachment Persistence
**Steps:**
- [ ] Send messages with various attachments
- [ ] Close browser
- [ ] Reopen and load conversation
- [ ] **Expected**: All attachments load correctly
- [ ] **Check**: No base64 in stored messages (should be URLs)

### 9.3 Conversation Isolation
**Steps:**
- [ ] Create Conv A with message "Test A"
- [ ] Create Conv B with message "Test B"
- [ ] **Check**: Messages don't appear in wrong conversation
- [ ] Delete Conv A
- [ ] **Check**: Conv B is unaffected

### 9.4 Library Item Uniqueness
**Steps:**
- [ ] Generate same image twice (same prompt)
- [ ] **Expected**: Two separate items in library
- [ ] Delete one
- [ ] **Expected**: Other remains
- [ ] **Check Database**: Separate rows with unique IDs

### 9.5 Concurrent Edit Safety
**Steps:**
- [ ] Open same conversation in two tabs
- [ ] Edit message in tab 1
- [ ] Try to interact in tab 2
- [ ] **Expected**: No data corruption
- [ ] Reload both tabs
- [ ] **Check**: Most recent edit wins, data is consistent

---

## 10. FINAL CHECKS

### 10.1 Feature Completeness
- [ ] Review this entire checklist
- [ ] All features tested
- [ ] All tests passed or issues documented

### 10.2 Console Clean
- [ ] Open DevTools Console
- [ ] Perform 20 random actions
- [ ] **Expected**: No errors (red)
- [ ] Document any warnings

### 10.3 Network Clean
- [ ] Open DevTools Network tab
- [ ] Perform various actions
- [ ] **Expected**:
  - No 4xx errors (except 429 if rate limited intentionally)
  - No 5xx errors
  - All requests resolve

### 10.4 Database Check
- [ ] Open Supabase dashboard
- [ ] Check tables:
  - conversations: Has all conversations
  - messages: Has all messages
  - library: Has all media
- [ ] **Expected**: Data is clean, no orphaned records

### 10.5 Storage Check
- [ ] Check Supabase Storage
- [ ] **Expected**: All uploaded media is there
- [ ] Check for orphaned files (files with no DB reference)

### 10.6 Documentation
- [ ] Document any issues found
- [ ] Create bug reports for failed tests
- [ ] Note any performance concerns

---

## POST-TESTING ACTIONS

### Cleanup (if using test account)
- [ ] Delete test conversations
- [ ] Delete test media from library
- [ ] Clear test data from database

### Deployment Readiness
- [ ] All critical tests passed
- [ ] No blocking bugs
- [ ] Performance is acceptable
- [ ] Security checks passed

### Sign-off
- [ ] Tester name: ________________
- [ ] Date: ________________
- [ ] Approval: ☐ Ready to deploy ☐ Needs fixes

---

## QUICK REFERENCE: COMMON ISSUES TO WATCH FOR

1. **Base64 Images**: Images should be uploaded to Supabase, not stored as base64 in messages
2. **Message Order**: Ensure messages stay in chronological order after reload
3. **Video Polling**: Video queue should update status in real-time
4. **Memory Leaks**: Long sessions shouldn't slow down the app
5. **Race Conditions**: Rapid actions shouldn't cause data corruption
6. **Console Errors**: Any red errors need investigation
7. **Network 404s**: All API endpoints should exist
8. **Mobile Touch**: Buttons should be tappable on mobile (min 44px)
9. **SuperChat C1**: Interactive components should render correctly
10. **Lightbox Source**: Sketch-to-render should show source image in lightbox

---

**END OF CHECKLIST**

Total Sections: 10
Total Test Steps: 300+

Estimated Time: 4-6 hours for complete testing
