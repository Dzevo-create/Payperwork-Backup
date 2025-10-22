# Payperwork API Documentation

## Overview

Payperwork provides AI-powered content generation APIs for chat, images, videos, and presentations.

**Base URL**: `https://your-domain.com/api`
**Authentication**: Supabase Auth (JWT tokens)

---

## Authentication

All API requests require authentication using Supabase JWT tokens.

### Headers

```http
Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN
Content-Type: application/json
```

### Get Auth Token

```typescript
// Client-side
import { supabase } from "@/lib/supabase";

const {
  data: { session },
} = await supabase.auth.getSession();
const token = session?.access_token;
```

---

## Slides API

### POST `/api/slides/workflow/pipeline`

Generate complete presentation with topics, slides, and content.

**Request Body**:

```json
{
  "prompt": "Create a presentation about AI in healthcare",
  "settings": {
    "format": "16:9" | "4:3",
    "theme": "professional" | "creative" | "minimal",
    "slideCount": 10,
    "enableResearch": true,
    "researchDepth": "standard" | "deep"
  }
}
```

**Response**:

```json
{
  "success": true,
  "presentationId": "uuid",
  "topics": [
    {
      "title": "Introduction to AI",
      "description": "Overview of AI technologies",
      "estimatedSlides": 2
    }
  ],
  "slides": [
    {
      "id": "uuid",
      "title": "Introduction",
      "content": "...",
      "layout": "title-slide",
      "imageUrl": "https://...",
      "notes": "Speaker notes..."
    }
  ],
  "metadata": {
    "totalSlides": 10,
    "totalTime": 15000,
    "qualityScore": 0.95
  }
}
```

**Error Responses**:

- `400` - Invalid request body
- `401` - Unauthorized
- `500` - Server error

---

### POST `/api/slides/workflow/generate-topics`

Generate presentation topics from a prompt.

**Request Body**:

```json
{
  "prompt": "AI in healthcare",
  "slideCount": 10,
  "enableResearch": true
}
```

**Response**:

```json
{
  "topics": [
    {
      "title": "Topic Title",
      "description": "Topic description",
      "estimatedSlides": 2,
      "researchInsights": ["insight1", "insight2"]
    }
  ]
}
```

---

### POST `/api/slides/workflow/generate-slides`

Generate slides from topics.

**Request Body**:

```json
{
  "presentationId": "uuid",
  "topics": [...],
  "theme": "professional"
}
```

**Response**:

```json
{
  "slides": [...]
}
```

---

## Chat API

### POST `/api/chat/claude`

Send message to Claude AI assistant.

**Request Body**:

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, Claude!"
    }
  ],
  "model": "claude-3-5-sonnet-20241022",
  "maxTokens": 4096,
  "conversationId": "uuid" // optional
}
```

**Response** (Streaming):

```
data: {"type":"message_start"}
data: {"type":"content_block_start"}
data: {"type":"content_block_delta","delta":{"text":"Hello!"}}
data: {"type":"content_block_stop"}
data: {"type":"message_stop"}
```

---

## Image Generation API

### POST `/api/image/flux/generate`

Generate images using FLUX model.

**Request Body**:

```json
{
  "prompt": "A beautiful sunset over mountains",
  "model": "flux-pro" | "flux-dev" | "flux-schnell",
  "size": "1024x1024" | "1024x768" | "768x1024",
  "numImages": 1,
  "guidance": 7.5,
  "seed": 123456 // optional
}
```

**Response**:

```json
{
  "images": [
    {
      "url": "https://storage.googleapis.com/...",
      "seed": 123456
    }
  ],
  "metadata": {
    "model": "flux-pro",
    "generationTime": 5000
  }
}
```

---

### POST `/api/image/enhance`

Enhance image prompt using AI.

**Request Body**:

```json
{
  "prompt": "sunset",
  "style": "photorealistic" | "artistic" | "illustration",
  "brandContext": {
    "colors": ["#FF5733"],
    "keywords": ["modern", "minimal"]
  }
}
```

**Response**:

```json
{
  "enhancedPrompt": "A stunning photorealistic sunset with vibrant colors...",
  "suggestions": {
    "styles": ["realistic", "dramatic"],
    "lighting": ["golden hour", "soft shadows"]
  }
}
```

---

## Video Generation API

### POST `/api/video/runway/generate`

Generate videos using Runway ML.

**Request Body**:

```json
{
  "prompt": "A cat playing piano",
  "duration": 5,
  "resolution": "1280x720",
  "fps": 24,
  "imageUrl": "https://..." // optional, for image-to-video
}
```

**Response**:

```json
{
  "taskId": "uuid",
  "status": "processing",
  "estimatedTime": 60
}
```

---

### GET `/api/video/runway/status/:taskId`

Check video generation status.

**Response**:

```json
{
  "status": "completed" | "processing" | "failed",
  "videoUrl": "https://...",
  "thumbnail": "https://...",
  "progress": 100
}
```

---

## Library API

### GET `/api/library/images`

Get user's image library.

**Query Parameters**:

- `page` (number, default: 1)
- `limit` (number, default: 20)
- `sortBy` (string, default: "created_at")

**Response**:

```json
{
  "images": [
    {
      "id": "uuid",
      "url": "https://...",
      "prompt": "...",
      "createdAt": "2025-10-22T10:00:00Z",
      "metadata": {
        "model": "flux-pro",
        "size": "1024x1024"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

---

### DELETE `/api/library/images/:id`

Delete an image from library.

**Response**:

```json
{
  "success": true
}
```

---

## Branding API

### GET `/api/branding`

Get user's branding settings.

**Response**:

```json
{
  "colors": ["#FF5733", "#3498DB"],
  "fonts": ["Inter", "Roboto"],
  "keywords": ["modern", "professional"],
  "logoUrl": "https://...",
  "voiceTone": "professional" | "casual" | "formal"
}
```

---

### PUT `/api/branding`

Update branding settings.

**Request Body**:

```json
{
  "colors": ["#FF5733"],
  "fonts": ["Inter"],
  "keywords": ["modern"]
}
```

**Response**:

```json
{
  "success": true,
  "branding": {...}
}
```

---

## WebSocket Events

Connect to real-time updates:

```typescript
import { io } from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_APP_URL!);

// Join user room
socket.emit("join:user", userId);

// Listen for events
socket.on("slides:thinking", (data) => {
  console.log("AI is thinking:", data);
});

socket.on("slides:topics-generated", (data) => {
  console.log("Topics generated:", data.topics);
});

socket.on("slides:slide-preview", (data) => {
  console.log("Slide preview:", data.slide);
});

socket.on("slides:generation-completed", (data) => {
  console.log("Generation completed:", data);
});

socket.on("slides:error", (error) => {
  console.error("Error:", error);
});
```

**Available Events**:

- `slides:thinking` - AI processing message
- `slides:topics-generated` - Topics generated
- `slides:slide-preview` - Individual slide preview
- `slides:generation-completed` - Generation complete
- `slides:error` - Error occurred

---

## Error Codes

| Code | Description                                  |
| ---- | -------------------------------------------- |
| 400  | Bad Request - Invalid input                  |
| 401  | Unauthorized - Missing or invalid auth token |
| 403  | Forbidden - Insufficient permissions         |
| 404  | Not Found - Resource not found               |
| 429  | Too Many Requests - Rate limit exceeded      |
| 500  | Internal Server Error                        |
| 503  | Service Unavailable - External API down      |

**Error Response Format**:

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Prompt is required",
    "details": {
      "field": "prompt",
      "reason": "missing"
    }
  }
}
```

---

## Rate Limits

| Endpoint        | Limit              |
| --------------- | ------------------ |
| `/api/chat/*`   | 60 requests/minute |
| `/api/image/*`  | 30 requests/minute |
| `/api/video/*`  | 10 requests/minute |
| `/api/slides/*` | 20 requests/minute |

**Rate Limit Headers**:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1698764400
```

---

## SDK Examples

### TypeScript/JavaScript

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Generate slides
async function generateSlides(prompt: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch("/api/slides/workflow/pipeline", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      prompt,
      settings: {
        format: "16:9",
        theme: "professional",
        slideCount: 10,
      },
    }),
  });

  return response.json();
}
```

### Python

```python
import requests

def generate_slides(prompt: str, token: str):
    response = requests.post(
        'https://your-domain.com/api/slides/workflow/pipeline',
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        },
        json={
            'prompt': prompt,
            'settings': {
                'format': '16:9',
                'theme': 'professional',
                'slideCount': 10
            }
        }
    )
    return response.json()
```

---

## Best Practices

1. **Authentication**:
   - Always include valid JWT token
   - Refresh tokens before they expire
   - Handle 401 errors gracefully

2. **Error Handling**:
   - Implement exponential backoff for retries
   - Check error codes and handle appropriately
   - Log errors for debugging

3. **Rate Limiting**:
   - Respect rate limit headers
   - Implement client-side throttling
   - Queue requests when approaching limits

4. **Performance**:
   - Use streaming for chat responses
   - Cache responses when appropriate
   - Optimize image sizes

5. **Security**:
   - Never expose API keys in client code
   - Validate all user input
   - Use HTTPS for all requests

---

## Changelog

### v2.0.0 (2025-10-22)

- ✅ Added comprehensive slides generation pipeline
- ✅ Implemented auth error translation
- ✅ Added centralized logging
- ✅ Improved error handling

### v1.0.0 (2024-XX-XX)

- Initial release

---

## Support

- **Documentation**: https://docs.your-domain.com
- **API Status**: https://status.your-domain.com
- **Email**: api-support@your-domain.com
- **Discord**: https://discord.gg/your-server

---

**Last Updated**: 2025-10-22
**API Version**: 2.0.0
