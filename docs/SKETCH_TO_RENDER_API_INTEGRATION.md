# Sketch-to-Render API Integration Guide

## Overview

The main generation API endpoint for the Sketch-to-Render workflow has been successfully created at:

```
app/api/sketch-to-render/route.ts
```

This endpoint serves as the **"Generate" button** in the workflow, transforming architectural sketches into photorealistic renderings using **Nano Banana (Gemini 2.5 Flash Image / Payperwork Flash v.1)**.

---

## Endpoint Details

### Route Information

- **Path**: `POST /api/sketch-to-render`
- **Purpose**: Transform sketch/floor plan into photorealistic architectural rendering
- **Model**: Gemini 2.5 Flash Image (Nano Banana / Payperwork Flash v.1)
- **Rate Limit**: 5 images per minute (via `imageGenerationRateLimiter`)

---

## API Contract

### Request Schema

```typescript
POST /api/sketch-to-render
Content-Type: application/json

{
  "prompt": string,              // Optional: User prompt or T-Button generated
  "sourceImage": {               // Required: Sketch/floor plan to render
    "data": string,              // Base64-encoded image
    "mimeType": string           // e.g., "image/png", "image/jpeg"
  },
  "referenceImage": {            // Optional: Reference image for style guidance
    "data": string,
    "mimeType": string
  },
  "settings": {                  // Optional: Render configuration
    "designStyle": string | null,      // e.g., "scandinavian", "modern"
    "renderStyle": string | null,      // e.g., "photorealistic", "hyperrealistic"
    "timeOfDay": string | null,        // e.g., "morning", "evening"
    "aspectRatio": string | null,      // e.g., "16:9", "9:16"
    "spaceType": string | null,        // "interior" or "exterior"
    "season": string | null,           // e.g., "spring", "summer"
    "weather": string | null,          // e.g., "sunny", "cloudy"
    "quality": string | null           // "ultra", "high", "standard"
  }
}
```

### Response Schema

#### Success Response (200)

```typescript
{
  "image": {
    "data": string,              // Base64-encoded generated image
    "mimeType": string           // e.g., "image/png"
  },
  "metadata": {
    "prompt": string | null,     // Original user prompt
    "enhancedPrompt": string,    // GPT-4o enhanced prompt used
    "settings": object | null,   // Settings used for generation
    "timestamp": string,         // ISO 8601 timestamp
    "model": string              // "gemini-2.5-flash-image-preview"
  }
}
```

#### Error Responses

- **400 Bad Request**: Invalid input (missing source image, invalid format)
- **401 Unauthorized**: Missing or invalid API key
- **429 Too Many Requests**: Rate limit exceeded (5 images/minute)
- **500 Internal Server Error**: Generation failure or API error

---

## Workflow Steps

### 1. **Validation & Rate Limiting**
   - Validates Google Gemini API key (`GOOGLE_GEMINI_API_KEY`)
   - Checks content type (must be `application/json`)
   - Enforces rate limit (5 images per minute per client)

### 2. **Image Validation**
   - Validates source image (required)
   - Validates reference image (optional)
   - Checks base64 format and MIME type

### 3. **Prompt Enhancement**
   - Uses GPT-4o Vision to analyze sketch structure
   - Generates architectural prompt based on:
     - User prompt (if provided)
     - Settings configuration
     - Source image analysis
   - **Fallback**: If GPT-4o fails, uses basic architectural prompt builder

### 4. **Image Preparation**
   - Orders images correctly:
     1. Reference image (if provided) - **FIRST**
     2. Source image - **LAST** (determines aspect ratio per Nano Banana requirements)

### 5. **Generation with Nano Banana**
   - Initializes Gemini 2.5 Flash Image model
   - Builds generation config from settings
   - Generates rendering with retry logic (up to 4 attempts)
   - Parses response and extracts generated image

### 6. **Response**
   - Returns generated image with metadata
   - Includes enhanced prompt for debugging/refinement

---

## Key Implementation Details

### Image Order (CRITICAL!)

**The source image MUST be LAST** in the images array. This is a Nano Banana requirement:

```typescript
// Reference images FIRST (optional)
// Source image LAST (required) - determines aspect ratio
const images = prepareImagesForGeneration(
  sourceImage,
  referenceImage ? [referenceImage] : undefined
);
```

### Prompt Enhancement

The endpoint uses a two-tier approach:

1. **Primary**: GPT-4o Vision analyzes sketch + settings → detailed architectural prompt
2. **Fallback**: Basic architectural prompt builder (if GPT-4o fails)

```typescript
try {
  enhancedPrompt = await enhanceSketchToRenderPrompt(
    prompt || "photorealistic architectural rendering",
    sourceImage,
    settings,
    referenceImage ? [referenceImage] : undefined
  );
} catch (error) {
  // Fallback to basic builder
  enhancedPrompt = buildArchitecturalPrompt(
    prompt || "photorealistic architectural rendering",
    settings
  );
}
```

### Error Handling

- Comprehensive error logging via `apiLogger`
- Structured error responses via `handleApiError`
- Rate limit errors include `Retry-After` header

---

## Dependencies

### Updated Files

- **lib/api-security.ts**: Added `validateGoogleGeminiKey()` function
- **lib/api-security.ts**: Added `'google-gemini'` to `validateApiKeys()` type union

### Required Imports

All imports are from existing, verified files:

```typescript
import { imageGenerationRateLimiter, getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import {
  enhanceSketchToRenderPrompt,
  prepareImagesForGeneration,
  validateImages,
  buildArchitecturalPrompt
} from "@/lib/api/workflows/sketchToRender";
import {
  geminiClient,
  GEMINI_MODELS,
  buildGenerationConfig,
  generateSingleImage,
  parseImageFromResponse,
} from "@/lib/api/providers/gemini";
import { RenderSettingsType } from "@/types/workflows/renderSettings";
```

---

## Environment Variables

### Required

```bash
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Optional (for prompt enhancement)

```bash
OPENAI_API_KEY=your_openai_api_key_here  # For GPT-4o Vision enhancement
```

---

## Frontend Integration

### Example Usage

```typescript
async function generateRendering(
  sourceImage: File,
  prompt?: string,
  referenceImage?: File,
  settings?: RenderSettingsType
) {
  // Convert files to base64
  const sourceImageData = await fileToImageData(sourceImage);
  const referenceImageData = referenceImage
    ? await fileToImageData(referenceImage)
    : undefined;

  // Call API
  const response = await fetch("/api/sketch-to-render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      sourceImage: sourceImageData,
      referenceImage: referenceImageData,
      settings,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Generation failed");
  }

  const result = await response.json();
  return result;
}
```

### Error Handling

```typescript
try {
  const result = await generateRendering(sourceImage, prompt, referenceImage, settings);

  // Success - display image
  displayGeneratedImage(result.image.data, result.image.mimeType);

  // Show metadata
  console.log("Enhanced prompt:", result.metadata.enhancedPrompt);
  console.log("Model:", result.metadata.model);

} catch (error) {
  if (error.message.includes("rate limit")) {
    // Show rate limit message
    showRateLimitError();
  } else if (error.message.includes("API key")) {
    // Show configuration error
    showConfigError();
  } else {
    // Show general error
    showGenerationError(error.message);
  }
}
```

---

## Testing

### Manual Testing

```bash
# Test with curl (example)
curl -X POST http://localhost:3000/api/sketch-to-render \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "modern living room",
    "sourceImage": {
      "data": "iVBORw0KGgoAAAANSUhEUg...",
      "mimeType": "image/png"
    },
    "settings": {
      "designStyle": "scandinavian",
      "renderStyle": "photorealistic",
      "timeOfDay": "morning",
      "aspectRatio": "16:9"
    }
  }'
```

### Test Cases

1. **Basic Generation**: Source image only, no prompt, no settings
2. **With Prompt**: Source image + user prompt
3. **With Settings**: Source image + full settings configuration
4. **With Reference**: Source image + reference image + settings
5. **Rate Limiting**: Exceed 5 requests per minute
6. **Invalid Input**: Missing source image, invalid base64, wrong MIME type
7. **Fallback**: Test with OpenAI API disabled (should use basic prompt builder)

---

## Monitoring & Logging

### Log Events

All operations are logged with structured metadata:

```typescript
// Info logs
apiLogger.info("Sketch-to-Render: Starting generation", { clientId, hasPrompt, hasReference });
apiLogger.info("Sketch-to-Render: Generation successful", { clientId, imageMimeType });

// Debug logs
apiLogger.debug("Sketch-to-Render: Prompt enhanced", { originalLength, enhancedLength });
apiLogger.debug("Sketch-to-Render: Images prepared", { imageCount });

// Warning logs
apiLogger.warn("Sketch-to-Render: Prompt enhancement failed, using fallback", { error });

// Error logs
apiLogger.error("Sketch-to-Render: Generation failed", { error, clientId });
```

### Metrics to Monitor

- Generation success rate
- Average generation time
- Prompt enhancement success rate
- Rate limit violations
- Error rates by type

---

## Performance Considerations

### Generation Time

- Expected: 5-15 seconds per image
- Depends on: Image complexity, server load, API response time

### Optimization

- **Retry Logic**: Up to 4 attempts with exponential backoff
- **Prompt Caching**: Consider caching GPT-4o enhancement results
- **Image Preprocessing**: Images are validated before generation starts

### Rate Limits

- **Client**: 5 images per minute (via `imageGenerationRateLimiter`)
- **Google Gemini**: Depends on your API tier
- **OpenAI (enhancement)**: Separate limit for GPT-4o Vision calls

---

## Next Steps

### Frontend Integration

1. Connect "Generate" button to this endpoint
2. Implement loading states (5-15s generation time)
3. Add progress indicators
4. Handle all error cases
5. Display generated images with metadata

### Features to Add

1. **Batch Generation**: Generate multiple variations
2. **Streaming**: Real-time progress updates
3. **Caching**: Cache generated images in Supabase
4. **History**: Store generation history per user
5. **Refinement**: Allow users to refine generated images

### Related Endpoints

- `POST /api/sketch-to-render/generate-prompt`: T-Button prompt generation
- Future: `POST /api/sketch-to-render/refine`: Image refinement
- Future: `POST /api/sketch-to-render/batch`: Batch generation

---

## Troubleshooting

### Common Issues

#### 1. "Google Gemini API key not configured"

**Solution**: Set `GOOGLE_GEMINI_API_KEY` in `.env.local`

```bash
GOOGLE_GEMINI_API_KEY=your_key_here
```

#### 2. "Rate limit exceeded"

**Solution**: Wait for rate limit reset (shown in `Retry-After` header)

#### 3. "Failed to generate rendering"

**Possible causes**:
- Invalid source image format
- API timeout
- Model unavailable

**Solution**: Check logs for specific error, retry with valid input

#### 4. Prompt enhancement fails consistently

**Solution**: Ensure `OPENAI_API_KEY` is set, or rely on fallback builder

---

## File Locations

```
app/api/sketch-to-render/
├── route.ts                          # Main generation endpoint (NEW)
└── generate-prompt/
    └── route.ts                      # T-Button prompt generator (existing)

lib/api/workflows/sketchToRender/
├── index.ts                          # Central exports
├── gptEnhancer.ts                    # GPT-4o prompt enhancement
├── promptBuilder.ts                  # Basic prompt builder
└── imageProcessor.ts                 # Image validation & processing

lib/api/providers/
└── gemini.ts                         # Gemini client & utilities

types/workflows/
├── renderSettings.ts                 # Settings type definitions
└── sketchToRender.ts                 # API type definitions

lib/
├── api-security.ts                   # API key validation (UPDATED)
├── rate-limit.ts                     # Rate limiting
├── logger.ts                         # Structured logging
└── api-error-handler.ts              # Error handling
```

---

## Summary

The Sketch-to-Render generation API is now **fully implemented** and ready for frontend integration. The endpoint:

- Uses Nano Banana (Gemini 2.5 Flash Image) for generation
- Enhances prompts with GPT-4o Vision (with fallback)
- Handles images in correct order (reference first, source last)
- Includes comprehensive error handling and logging
- Enforces rate limits (5 images/minute)
- Returns detailed metadata for debugging/refinement

**Status**: **Ready for Integration**

**Next**: Connect frontend "Generate" button to `POST /api/sketch-to-render`
