# Sketch-to-Render Database Integration

## Overview

Complete database persistence integration for the Sketch-to-Render workflow. All generations (renders, videos, and upscales) are now automatically saved to and loaded from Supabase.

## Implementation Summary

### 1. Database Schema

**Table:** `sketch_to_render`

**Fields:**
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users
- `url` (TEXT): URL to the generated media
- `thumbnail_url` (TEXT): Optional thumbnail URL
- `type` (TEXT): 'render' | 'video' | 'upscale'
- `source_type` (TEXT): 'original' | 'from_render' | 'from_video'
- `parent_id` (UUID): Optional reference to parent generation
- `prompt` (TEXT): Generation prompt
- `model` (TEXT): AI model used (e.g., 'nano-banana', 'runway-gen4-turbo')
- `settings` (JSONB): Generation settings
- `metadata` (JSONB): Additional metadata
- `name` (TEXT): Auto-generated filename
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Migration:** `supabase/migrations/004_sketch_to_render.sql`

### 2. API Routes

#### `/api/sketch-to-render/save-generation` (POST)
Saves a new generation to the database.

**Request Body:**
```json
{
  "url": "string",
  "type": "render" | "video" | "upscale",
  "name": "string",
  "model": "string",
  "prompt": "string (optional)",
  "sourceType": "original" | "from_render" | "from_video",
  "parentId": "string (optional)",
  "settings": "object (optional)"
}
```

#### `/api/sketch-to-render/generations` (GET)
Loads recent generations for the current user (limit: 50).

**Response:**
```json
{
  "generations": [
    {
      "id": "uuid",
      "url": "string",
      "type": "render" | "video" | "upscale",
      "name": "string",
      "prompt": "string",
      "model": "string",
      "source_type": "string",
      "settings": "object",
      "created_at": "timestamp"
    }
  ]
}
```

#### `/api/sketch-to-render/delete-generation` (DELETE)
Deletes a generation from the database.

**Request Body:**
```json
{
  "generationId": "uuid"
}
```

### 3. Frontend Integration

#### Load on Mount
The Sketch-to-Render page automatically loads recent generations from the database when the component mounts using a `useEffect` hook.

```typescript
useEffect(() => {
  const loadGenerations = async () => {
    const response = await fetch("/api/sketch-to-render/generations");
    const data = await response.json();
    setRecentGenerations(data.generations);
  };
  loadGenerations();
}, []);
```

#### Save After Generation
All generation success handlers (`handleGenerateSuccess`, `handleEditSuccess`, `handleUpscaleSuccess`, `handleCreateVideo`) automatically save to the database after adding to the UI state.

```typescript
await saveGenerationToDb({
  url: imageUrl,
  type: "render",
  name: autoName,
  prompt: prompt,
  sourceType: "original",
  settings: renderSettings,
});
```

#### Delete on Remove
When a user deletes a generation from the UI, it's also removed from the database.

```typescript
onDelete={async (id) => {
  setRecentGenerations((prev) => prev.filter((g) => g.id !== id));
  await fetch("/api/sketch-to-render/delete-generation", {
    method: "DELETE",
    body: JSON.stringify({ generationId: id }),
  });
}}
```

### 4. Visual Badges

The `RecentGenerations` component displays visual badges to distinguish generation types:

- **VIDEO Badge**: Black background with white Video icon and "VIDEO" text
- **UPSCALE Badge**: Accent color background with white Sparkles icon and "UPSCALE" text
- **Regular Renders**: No badge

Badges appear in the top-left corner of each generation thumbnail with backdrop blur for better visibility.

## Files Modified

### API Routes (Created)
- `app/api/sketch-to-render/save-generation/route.ts`
- `app/api/sketch-to-render/generations/route.ts`
- `app/api/sketch-to-render/delete-generation/route.ts`

### Database (Created)
- `supabase/migrations/004_sketch_to_render.sql`
- `lib/supabase-sketch-to-render.ts`

### Frontend (Modified)
- `app/workflows/sketch-to-render/page.tsx`
  - Added `useEffect` for loading generations on mount
  - Added `saveGenerationToDb` helper function
  - Updated all generation success handlers to save to DB
  - Updated delete handler to remove from DB
  - Added `isLoadingGenerations` state

- `components/workflows/RecentGenerations.tsx`
  - Added `type` and `sourceType` fields to Generation interface
  - Added video rendering support (`<video>` element)
  - Added visual badges for VIDEO and UPSCALE types

## Setup Instructions

### 1. Run Database Migration

Execute the migration in Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Copy the contents of `supabase/migrations/004_sketch_to_render.sql`
5. Run the migration

### 2. Verify RLS Policies

Ensure Row Level Security (RLS) policies are active:
- Users can only see their own generations
- Users can only delete their own generations
- Users can only insert generations for themselves

### 3. Test the Integration

1. Navigate to `/workflows/sketch-to-render`
2. Generate a render → Should appear in "Kürzliche Generierungen"
3. Refresh the page → Render should still be there
4. Create a video from the render → Video should appear with VIDEO badge
5. Upscale the render → Upscaled version should appear with UPSCALE badge
6. Delete a generation → Should be removed from both UI and database

## Model Mapping

- **Renders**: `nano-banana` (Google Gemini-based)
- **Videos**: `runway-gen4-turbo` (Runway ML)
- **Upscales**: `nano-banana` (Freepik Magnific AI via Nano Banana)

## Benefits

1. **Persistence**: Generations survive page refreshes and browser sessions
2. **Multi-Device**: Access generations from any device
3. **History**: Complete generation history with timestamps
4. **Traceability**: Track which generations were derived from others (parent-child relationships)
5. **Organization**: Auto-generated names and metadata for easy identification
6. **Type Safety**: TypeScript interfaces ensure data consistency

## Next Steps (Optional Future Enhancements)

1. **Pagination**: Add pagination for users with many generations
2. **Search**: Add search/filter functionality by prompt, type, or date
3. **Bulk Operations**: Allow selecting multiple generations for batch delete
4. **Export**: Add ability to download multiple generations as ZIP
5. **Sharing**: Add ability to share generations with other users
6. **Storage Cleanup**: Implement automatic deletion of old Supabase storage files when generations are deleted
