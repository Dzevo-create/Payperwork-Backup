# Video Generation Flow - End-to-End

## Probleme die wir gefunden haben:

1. ❌ **Alte Videos haben leere URLs** - `url: ""` in attachments
2. ❌ **VideoTask status bleibt auf "processing"** - wird nie auf "succeed" updated
3. ❌ **Videos werden nicht in Library gespeichert**
4. ❌ **Frontend zeigt Videos nicht an** - wegen falscher Rendering-Logik

## Korrekte End-to-End Pipeline:

### 1. **User triggers Video Generation**
```
User → ChatInput → ChatArea.handleSubmit() → handleVideoGeneration()
```

### 2. **API Call** (`useVideoGeneration.ts`)
```javascript
POST /api/generate-video
Body: {
  model: "payperwork-v2",  // fal.ai Sora 2
  type: "image2video",
  prompt: "Die katze spielt klavier",
  image: "data:image/png;base64,...",
  duration: "4",
  aspectRatio: "16:9"
}

Response: {
  task_id: "3231bd9e-56f3-4188-a31a-061a2123f603",
  status: "processing"
}
```

### 3. **Polling** (`useVideoQueue.ts`)
```javascript
// Alle 5 Sekunden:
GET /api/generate-video?task_id=xxx&model=payperwork-v2&type=image2video

// Wenn COMPLETED:
Response: {
  task_id: "xxx",
  status: "succeed",
  videos: [{
    url: "https://v3b.fal.media/files/.../video.mp4"
  }]
}
```

### 4. **onVideoReady Callback** (`ChatArea.tsx`)
```javascript
// MUSS FOLGENDES TUN:
1. ✅ Update message mit video URL
2. ✅ Set videoTask.status = "succeed"
3. ✅ Add video to library
4. ✅ Save to Supabase
```

### 5. **Rendering** (`MessageAttachments.tsx`)
```javascript
// SIMPLE REGEL:
if (att.url) {
  <VideoAttachment />  // Zeige Video
} else {
  <VideoGenerationPlaceholder />  // Zeige Loading
}
```

## Was funktioniert NICHT:

### Problem 1: onVideoReady wird nie aufgerufen
**Grund:** useVideoQueue polling funktioniert nicht korrekt

### Problem 2: Videos nie in Library
**Grund:** addToLibrary() Aufruf fehlt oder schlägt fehl

### Problem 3: Message nie updated
**Grund:** updateMessageWithAttachments() wird nie aufgerufen mit URL

## FIX PLAN:

1. ✅ Fixe VideoAttachment Rendering (DONE)
2. ⏳ Teste ob Polling funktioniert
3. ⏳ Teste ob onVideoReady aufgerufen wird
4. ⏳ Teste ob Library Integration funktioniert
5. ⏳ Teste ob Supabase korrekt updated wird

## TEST PLAN:

```bash
# 1. Generiere neues Video
# 2. Checke Browser Console für:
#    - "🎉 IMMEDIATE VIDEO READY" oder
#    - "📦 Video ready from polling"
#    - "✅ Marking queue item as completed"
#    - "✅ Message with attachments updated in Supabase"
#    - "✅ Added to library"
#
# 3. Checke ob Video erscheint
# 4. Checke Supabase:
#    - messages.attachments[0].url = "https://..."
#    - messages.video_task.status = "succeed"
#    - library_items has entry with message_id
```
