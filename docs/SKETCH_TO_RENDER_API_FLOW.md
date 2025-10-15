# Sketch-to-Render API Flow Diagram

## Complete Generation Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Client)                           │
├─────────────────────────────────────────────────────────────────────┤
│  1. User uploads sketch (sourceImage)                               │
│  2. Optional: Upload reference image                                │
│  3. Optional: Enter prompt OR click T-Button                        │
│  4. Optional: Configure settings (design style, time, etc.)         │
│  5. Click "Generate" button                                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              POST /api/sketch-to-render/generate-prompt             │
│                     (T-Button - OPTIONAL)                           │
├─────────────────────────────────────────────────────────────────────┤
│  Input:  { sourceImage, settings }                                  │
│  Model:  GPT-4o Vision                                              │
│  Output: { prompt: "AI-generated architectural prompt" }            │
└────────────────────────────┬────────────────────────────────────────┘
                             │ OR user types prompt
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  POST /api/sketch-to-render                         │
│              (Main Generation - "Generate" Button)                  │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 1: Validation                               │
├─────────────────────────────────────────────────────────────────────┤
│  • Validate API keys (GOOGLE_GEMINI_API_KEY)                        │
│  • Check Content-Type (must be application/json)                    │
│  • Rate limit check (5 images/min per client)                       │
│  • Validate sourceImage (required)                                  │
│  • Validate referenceImage (optional)                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Step 2: Prompt Enhancement (Primary)                   │
├─────────────────────────────────────────────────────────────────────┤
│  Function: enhanceSketchToRenderPrompt()                            │
│  Model:    GPT-4o Vision                                            │
│                                                                      │
│  Input:                                                              │
│    • User prompt (or default)                                       │
│    • Source image (analyzes architecture)                           │
│    • Settings (design style, time of day, etc.)                     │
│    • Reference images (optional)                                    │
│                                                                      │
│  Output:                                                             │
│    • Enhanced architectural prompt                                  │
│    • Incorporates: structure analysis + style + context             │
│                                                                      │
│  Fallback: If GPT-4o fails → go to Step 2B                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Step 2B: Prompt Builder (Fallback)                     │
├─────────────────────────────────────────────────────────────────────┤
│  Function: buildArchitecturalPrompt()                               │
│                                                                      │
│  Input:                                                              │
│    • User prompt (or default)                                       │
│    • Settings only (no image analysis)                              │
│                                                                      │
│  Output:                                                             │
│    • Basic architectural prompt with settings                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Step 3: Image Preparation                         │
├─────────────────────────────────────────────────────────────────────┤
│  Function: prepareImagesForGeneration()                             │
│                                                                      │
│  CRITICAL IMAGE ORDER:                                               │
│    1. Reference image(s) FIRST (if provided)                        │
│    2. Source image LAST (determines aspect ratio)                   │
│                                                                      │
│  Why: Nano Banana uses last image for aspect ratio                  │
│                                                                      │
│  Output: Array of Gemini image parts                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│            Step 4: Build Generation Configuration                   │
├─────────────────────────────────────────────────────────────────────┤
│  Function: buildGenerationConfig()                                  │
│                                                                      │
│  Input: settings.aspectRatio                                        │
│  Output: {                                                           │
│    responseModalities: ["IMAGE"],                                   │
│    imageConfig: { aspectRatio: "16:9" }  // if specified            │
│  }                                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│               Step 5: Generate with Nano Banana                     │
├─────────────────────────────────────────────────────────────────────┤
│  Function: generateSingleImage()                                    │
│  Model:    Gemini 2.5 Flash Image (gemini-2.5-flash-image-preview) │
│  Alias:    Nano Banana / Payperwork Flash v.1                       │
│                                                                      │
│  Request Parts:                                                      │
│    1. { text: enhancedPrompt }                                      │
│    2. { inlineData: referenceImage } // if provided                 │
│    3. { inlineData: sourceImage }    // LAST                        │
│                                                                      │
│  Retry Logic:                                                        │
│    • Max 4 attempts                                                  │
│    • Exponential backoff (2s, 4s, 8s)                               │
│    • Logs each retry attempt                                        │
│                                                                      │
│  Output: Gemini API response with generated image                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Step 6: Parse Response                             │
├─────────────────────────────────────────────────────────────────────┤
│  Function: parseImageFromResponse()                                 │
│                                                                      │
│  Tries multiple response structures:                                │
│    • candidates[0].content.parts[].inlineData                       │
│    • candidates[0].inlineData                                       │
│    • candidates[0].parts[].inlineData                               │
│                                                                      │
│  Output: {                                                           │
│    data: "base64...",                                               │
│    mimeType: "image/png"                                            │
│  }                                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Step 7: Return Response                          │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                   │
│    "image": {                                                        │
│      "data": "base64_encoded_image",                                │
│      "mimeType": "image/png"                                        │
│    },                                                                │
│    "metadata": {                                                     │
│      "prompt": "original user prompt",                              │
│      "enhancedPrompt": "GPT-4o enhanced prompt",                    │
│      "settings": { designStyle: "scandinavian", ... },              │
│      "timestamp": "2025-10-14T23:45:00.000Z",                       │
│      "model": "gemini-2.5-flash-image-preview"                      │
│    }                                                                 │
│  }                                                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Client)                           │
├─────────────────────────────────────────────────────────────────────┤
│  1. Display generated image                                         │
│  2. Show metadata (enhanced prompt, settings used)                  │
│  3. Allow download/save                                             │
│  4. Offer regenerate/refine options                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Error Occurs                                │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
         ┌──────────────────┐  ┌──────────────────┐
         │  Validation      │  │  Generation      │
         │  Error           │  │  Error           │
         └────────┬─────────┘  └────────┬─────────┘
                  │                     │
                  ▼                     ▼
         ┌──────────────────┐  ┌──────────────────┐
         │  400 Bad Request │  │  Retry Logic     │
         │                  │  │  (up to 4x)      │
         │  • Missing image │  └────────┬─────────┘
         │  • Invalid base64│           │
         │  • Wrong format  │           │
         └──────────────────┘           │
                                        ▼
                               ┌──────────────────┐
                               │  Still fails?    │
                               └────────┬─────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
         │  401 Unauthorized│  │  429 Rate Limit  │  │  500 Internal    │
         │                  │  │                  │  │                  │
         │  • Missing API   │  │  • 5 img/min     │  │  • API error     │
         │    key           │  │    exceeded      │  │  • Timeout       │
         │  • Invalid key   │  │  • Retry-After   │  │  • Model down    │
         └──────────────────┘  │    header        │  └──────────────────┘
                               └──────────────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │  Client handles  │
                               │  error type      │
                               └──────────────────┘
```

---

## Rate Limiting Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Request arrives                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                ┌──────────────────────────────┐
                │  Get client ID from IP       │
                │  (x-forwarded-for header)    │
                └────────────┬─────────────────┘
                             │
                             ▼
                ┌──────────────────────────────┐
                │  Check rate limit cache      │
                │  (in-memory Map)             │
                └────────────┬─────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
         ┌──────────────────┐  ┌──────────────────┐
         │  Under limit     │  │  Over limit      │
         │  (< 5 req/min)   │  │  (≥ 5 req/min)   │
         └────────┬─────────┘  └────────┬─────────┘
                  │                     │
                  ▼                     ▼
         ┌──────────────────┐  ┌──────────────────┐
         │  Increment       │  │  Return 429      │
         │  counter         │  │                  │
         │                  │  │  Headers:        │
         │  Continue to     │  │  • Retry-After   │
         │  generation      │  │  • X-RateLimit-* │
         └──────────────────┘  └──────────────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  Response headers│
         │  • X-RateLimit-  │
         │    Limit: 5      │
         │  • X-RateLimit-  │
         │    Remaining: N  │
         │  • X-RateLimit-  │
         │    Reset: Unix   │
         └──────────────────┘
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT SIDE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Source Image │  │  Reference   │  │   Settings   │             │
│  │  (File)      │  │   (File)     │  │   (Object)   │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                 │                       │
│         └─────────────────┴─────────────────┘                       │
│                           │                                          │
│                           ▼                                          │
│                 ┌──────────────────┐                                │
│                 │  fileToImageData │                                │
│                 │  (Convert to     │                                │
│                 │   base64)        │                                │
│                 └────────┬─────────┘                                │
│                          │                                           │
└──────────────────────────┼───────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API BOUNDARY                                 │
│         POST /api/sketch-to-render (Content-Type: JSON)             │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVER SIDE                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Security & Validation Layer                    │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  • API key validation (GOOGLE_GEMINI_API_KEY)              │    │
│  │  • Content-Type check                                       │    │
│  │  • Rate limiting (5 req/min)                                │    │
│  │  • Image validation (base64, MIME type)                     │    │
│  └──────────────────────────┬─────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Prompt Enhancement Layer                       │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  GPT-4o Vision (Primary)                                    │    │
│  │  • Analyzes sketch structure                                │    │
│  │  • Incorporates settings                                    │    │
│  │  • Considers reference images                               │    │
│  │  ───────────────────────────────────────────────            │    │
│  │  Basic Builder (Fallback)                                   │    │
│  │  • Settings-based prompt                                    │    │
│  │  • No image analysis                                        │    │
│  └──────────────────────────┬─────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Image Processing Layer                         │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  • Order images (reference first, source last)              │    │
│  │  • Convert to Gemini format (inlineData)                    │    │
│  │  • Strip data URL prefixes                                  │    │
│  └──────────────────────────┬─────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Generation Layer                               │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  Nano Banana (Gemini 2.5 Flash Image)                       │    │
│  │  • Build generation config                                  │    │
│  │  • Assemble content parts                                   │    │
│  │  • Call API with retry logic                                │    │
│  │  • Parse response                                           │    │
│  └──────────────────────────┬─────────────────────────────────┘    │
│                             │                                        │
│                             ▼                                        │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Response Assembly                              │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │  • Generated image (base64)                                 │    │
│  │  • Metadata (prompts, settings, timestamp)                  │    │
│  │  • Logging                                                  │    │
│  └──────────────────────────┬─────────────────────────────────┘    │
│                             │                                        │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API RESPONSE                                 │
│                   (JSON with image + metadata)                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### 1. T-Button Integration (Optional)

```
User clicks T-Button
  ↓
POST /api/sketch-to-render/generate-prompt
  ↓
Get AI-generated prompt
  ↓
Display in input field
  ↓
User reviews/edits
  ↓
Proceed to generation →
```

### 2. Generate Button Integration (Required)

```
User clicks "Generate"
  ↓
Validate inputs (source image required)
  ↓
POST /api/sketch-to-render
  ↓
Show loading (5-15s)
  ↓
Display generated image
```

### 3. Settings Integration

```
User configures settings
  ↓
Pass to API in request body
  ↓
Used for prompt enhancement
  ↓
Applied in generation config
```

### 4. Reference Image Integration (Optional)

```
User uploads reference
  ↓
Convert to base64
  ↓
Include in API request
  ↓
Influences style/design
```

---

## Summary

This flow diagram illustrates:

1. **Complete workflow** from frontend to backend and back
2. **Error handling** at each layer
3. **Rate limiting** mechanism
4. **Data transformations** throughout the pipeline
5. **Integration points** for frontend implementation

The API is designed to be:
- **Robust**: Multiple layers of validation and error handling
- **Flexible**: Optional prompt, reference, and settings
- **Intelligent**: GPT-4o enhancement with fallback
- **Performant**: Retry logic and rate limiting
- **Observable**: Comprehensive logging at every step
