# Upscaling Debug Improvements

**Date**: 2025-10-15
**Feature**: Freepik Magnific AI Upscaling Debugging
**Workflow**: Sketch-to-Render

## Problem Statement

User reported upscaling failures with two error messages:
1. "Upscaling fehlgeschlagen: Upscaling fehlgeschlagen"
2. "Upscaling fehlgeschlagen: Kein upscaliertes Bild erhalten"

Backend logs showed task creation succeeded but polling wasn't completing properly:
- `ℹ️ Upscale task created {task_id: '6b072218-c15a-4b4f-847a-09076b759aea', status: 'CREATED'}`
- Frontend error suggested polling might be completing but returning no image URL
- Likely issue: Freepik API response structure not matching expected format

## Solution Implemented

Added comprehensive logging and error handling to both backend and frontend upscaling code to identify the exact failure point.

### Files Modified

#### 1. `app/api/sketch-to-render/upscale/route.ts`

**POST Endpoint (Lines 114-133)**:
- Added full response logging: `fullResponse: JSON.stringify(data, null, 2)`
- Added response validation to catch invalid/malformed responses
- Enhanced error handling for missing task_id

```typescript
// Log full response for debugging
apiLogger.info("Upscale task created", {
  task_id: data.data?.task_id,
  status: data.data?.status,
  fullResponse: JSON.stringify(data, null, 2),
});

// Validate response structure
if (!data.data?.task_id) {
  apiLogger.error("Freepik API returned invalid response", { data });
  throw new Error("Freepik API returned invalid response - no task_id");
}
```

**GET Endpoint (Lines 179-194)**:
- Added full response logging to understand exact API response structure
- Added multiple fallback checks for image URL (`data.generated`, `data.image`)
- Enhanced logging to show: status, hasGenerated, generatedCount, fullResponse

```typescript
// Log full response for debugging
apiLogger.info("Upscale task status", {
  task_id,
  status: data.data?.status,
  hasGenerated: !!data.data?.generated,
  generatedCount: data.data?.generated?.length || 0,
  fullResponse: JSON.stringify(data, null, 2),
});

return NextResponse.json({
  task_id: data.data?.task_id || task_id,
  status: data.data?.status || "UNKNOWN",
  generated: data.data?.generated || data.data?.image || null,
});
```

#### 2. `hooks/workflows/useUpscale.ts`

**Poll Response Logging (Lines 76-81)**:
```typescript
console.log("[Upscale] Poll response:", {
  pollCount,
  status: data.status,
  hasGenerated: !!data.generated,
  generated: data.generated,
});
```

**Flexible Image URL Extraction (Lines 95-105)**:
- Added support for multiple response structures
- Tries array format: `data.generated[0]`
- Tries string format: `data.generated`
- Tries alternative field: `data.image`

```typescript
// Get the image URL (try different response structures)
let imageUrl: string | null = null;

if (data.generated && Array.isArray(data.generated) && data.generated.length > 0) {
  imageUrl = data.generated[0];
} else if (data.generated && typeof data.generated === 'string') {
  imageUrl = data.generated;
} else if (data.image) {
  imageUrl = data.image;
}

console.log("[Upscale] Completed with image:", imageUrl);

if (imageUrl) {
  resolve(imageUrl);
} else {
  console.error("[Upscale] No image URL in response:", data);
  reject(new Error("Kein upscaliertes Bild erhalten"));
}
```

**Task Creation Logging (Lines 226-229)**:
```typescript
console.log("[Upscale] Task created:", {
  task_id: newTaskId,
  status: data.status,
});

console.log("[Upscale] Starting polling for task:", newTaskId);
```

## Debugging Workflow

### Step 1: Check Console Logs
When you click the "Upscaling" button, watch browser console for:

1. **Task Creation**:
```
[Upscale] Task created: { task_id: "xxx", status: "CREATED" }
[Upscale] Starting polling for task: xxx
```

2. **Polling Progress**:
```
[Upscale] Poll response: { pollCount: 1, status: "IN_PROGRESS", hasGenerated: false, generated: null }
[Upscale] Poll response: { pollCount: 2, status: "IN_PROGRESS", hasGenerated: false, generated: null }
...
[Upscale] Poll response: { pollCount: 5, status: "COMPLETED", hasGenerated: true, generated: ["https://..."] }
[Upscale] Completed with image: https://...
```

3. **Error Cases**:
```
[Upscale] No image URL in response: { status: "COMPLETED", generated: null }
```

### Step 2: Check Server Logs
Look for backend API logs in terminal:

1. **Task Creation**:
```
ℹ️ Upscale request received
ℹ️ Starting Freepik upscale task { sharpen: 50, smart_grain: 7, ultra_detail: 30 }
ℹ️ Upscale task created {
  task_id: "xxx",
  status: "CREATED",
  fullResponse: "{ ... full API response ... }"
}
```

2. **Polling**:
```
ℹ️ Polling upscale task status { task_id: "xxx" }
ℹ️ Upscale task status {
  task_id: "xxx",
  status: "COMPLETED",
  hasGenerated: true,
  generatedCount: 1,
  fullResponse: "{ ... full API response ... }"
}
```

3. **Errors**:
```
❌ Freepik API error { status: 401, error: "Invalid API key" }
❌ Freepik API returned invalid response { data: {...} }
```

## Expected Behavior

### Successful Upscaling Flow:
1. User clicks "Upscaling" button
2. Frontend converts image to base64
3. POST request creates Freepik task → returns task_id
4. Polling starts every 5 seconds
5. Status changes: CREATED → IN_PROGRESS → COMPLETED
6. When COMPLETED, `generated` array contains upscaled image URLs
7. Frontend displays upscaled image and adds to "Kürzlich generierte"

### Error Cases to Watch For:

**Case 1: API Key Invalid**
- Server logs: "Freepik API error { status: 401 }"
- Fix: Verify FPSX58ea5cc5515777478765a7ae7fdecec4 is correct

**Case 2: Malformed Response**
- Server logs: "Freepik API returned invalid response"
- Check `fullResponse` to see actual API structure

**Case 3: Completed but No Image**
- Console logs: "[Upscale] No image URL in response"
- Check `fullResponse` in server logs to see actual response structure
- Freepik might be using different field name than `generated`

**Case 4: Polling Timeout**
- After 60 polls (5 minutes), error: "Upscaling Timeout"
- Indicates Freepik task is stuck in IN_PROGRESS or CREATED state

## Testing Instructions

1. **Navigate to Sketch-to-Render**:
   ```
   http://localhost:3002/workflows/sketch-to-render
   ```

2. **Generate a Render**:
   - Upload sketch + reference
   - Click "Generate"
   - Wait for render to complete

3. **Test Upscaling**:
   - Click "Upscaling" button in ResultPanel
   - Open browser console (F12 → Console tab)
   - Watch for `[Upscale]` log messages
   - Check terminal for backend logs

4. **Verify Results**:
   - ✅ Success: Upscaled image appears in result panel
   - ✅ Success: New item added to "Kürzlich generierte" with timestamp name
   - ❌ Failure: Check console logs for exact error
   - ❌ Failure: Check server logs for Freepik API response

## Known Issues

1. **Hot Module Reload**:
   - During development, HMR might interrupt polling intervals
   - Solution: Hard refresh (Cmd+Shift+R) after code changes

2. **Rate Limiting**:
   - No rate limit currently applied to upscaling
   - Consider adding if Freepik has rate limits

3. **Image Size Limits**:
   - Freepik may have file size limits
   - Currently no frontend validation for this

## Next Steps

1. ✅ Comprehensive logging added
2. ⏳ Test with real upscaling request
3. ⏳ Analyze Freepik API response structure from logs
4. ⏳ Adjust response parsing if needed based on actual API format
5. ⏳ Add user feedback if Freepik API has specific error messages

## Related Files

- Backend API: [app/api/sketch-to-render/upscale/route.ts](../app/api/sketch-to-render/upscale/route.ts)
- Frontend Hook: [hooks/workflows/useUpscale.ts](../hooks/workflows/useUpscale.ts)
- Main Page: [app/workflows/sketch-to-render/page.tsx](../app/workflows/sketch-to-render/page.tsx)

---

**Implementation Status**: ✅ DEBUGGING READY
**Build Status**: ✅ Compiling (dev server running)
**Ready for Testing**: YES - Try upscaling and check console + server logs
