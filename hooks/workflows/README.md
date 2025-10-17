# Workflows Hooks - Organizational Structure

## Overview

This directory contains all hooks related to workflow functionality (Sketch-to-Render, Branding, etc.), organized by responsibility for better maintainability and clarity.

## Directory Structure

```
hooks/workflows/
├── common/                    # Shared hooks used across all workflows
│   ├── usePromptEnhancer.ts   # T-Button prompt enhancement
│   ├── useRenderEdit.ts       # Edit functionality for renders
│   ├── useUpscale.ts          # Image upscaling
│   ├── useImageCrop.ts        # Image cropping modal
│   ├── useRecentGenerations.ts # Recent generations sidebar
│   ├── useWorkflowLightbox.ts  # Lightbox for viewing renders
│   ├── useWorkflowState.ts     # Shared workflow state management
│   ├── useWorkflowGeneration.ts # Generation orchestration
│   └── useWorkflowHandlers.ts   # Event handlers for workflows
│
├── sketch-to-render/          # Sketch-to-Render specific hooks
│   └── useSketchToRender.ts   # Main generation hook for sketch-to-render
│
├── branding/                  # Branding specific hooks
│   └── useBranding.ts         # Main generation hook for branding
│
├── adapters/                  # Adapter layer for standardization
│   └── useWorkflowAdapter.ts  # Adapters for WorkflowPage component
│
├── index.ts                   # Central export point (use this!)
└── README.md                  # This file
```

## Usage

### Import from the central export

**✅ BEST PRACTICE:**
```typescript
// Import from the central index - this is the recommended way
import {
  useBranding,
  useSketchToRender,
  usePromptEnhancer,
  useWorkflowState
} from '@/hooks/workflows';
```

**❌ AVOID:**
```typescript
// Don't import directly from subdirectories
import { useBranding } from '@/hooks/workflows/branding/useBranding';
import { usePromptEnhancer } from '@/hooks/workflows/common/usePromptEnhancer';
```

### Hook Categories

#### 1. Common Hooks (Shared)
These hooks are used by multiple workflows:

- **`usePromptEnhancer`** - T-Button functionality
- **`useRenderEdit`** - Edit renders with AI
- **`useUpscale`** - Upscale images
- **`useImageCrop`** - Crop uploaded images
- **`useRecentGenerations`** - Load/display recent generations
- **`useWorkflowLightbox`** - Lightbox for viewing/editing renders
- **`useWorkflowState`** - Core workflow state (images, prompts, settings)
- **`useWorkflowGeneration`** - Orchestrates generation lifecycle
- **`useWorkflowHandlers`** - Event handlers for user interactions

#### 2. Workflow-Specific Hooks
These hooks are unique to each workflow:

- **`useSketchToRender`** - Sketch-to-Render generation logic
- **`useBranding`** - Branding generation logic

#### 3. Adapters
Standardized interfaces for the generic `WorkflowPage` component:

- **`useSketchToRenderAdapter`** - Wraps useSketchToRender
- **`useBrandingAdapter`** - Wraps useBranding
- **`usePromptEnhancerAdapter`** - Wraps usePromptEnhancer
- **`useRenderEditAdapter`** - Wraps useRenderEdit
- **`useUpscaleAdapter`** - Wraps useUpscale

## Adding a New Workflow

### Step 1: Create workflow-specific hook

Create a new file in the appropriate subdirectory:

```typescript
// hooks/workflows/my-workflow/useMyWorkflow.ts
import type { ImageData, GenerationResult, WorkflowHookOptions } from "@/types/workflows/common";

export function useMyWorkflow(options: WorkflowHookOptions = {}) {
  // Implementation...

  const generate = useCallback(async (
    prompt: string,
    sourceImage: ImageData,  // ✅ Use shared type
    settings: MyWorkflowSettingsType,
    referenceImage?: ImageData
  ): Promise<GenerationResult | null> => {
    // ...
  }, []);

  return { generate, isGenerating, error, progress };
}
```

### Step 2: Create adapter

Add adapter in `adapters/useWorkflowAdapter.ts`:

```typescript
export function useMyWorkflowAdapter(): StandardGenerateHook {
  const hook = useMyWorkflow();

  return {
    generate: async (params) => {
      const { prompt, settings, sourceImage, referenceImages } = params;

      const sourceImageData = sourceImage ? {
        file: null,
        preview: sourceImage,  // ✅ Correct format
      } : {file: null, preview: null};

      return await hook.generate(prompt, sourceImageData, settings);
    },
    isGenerating: hook.isGenerating,
    error: hook.error,
    progress: hook.progress,
  };
}
```

### Step 3: Export in index.ts

```typescript
// Add to hooks/workflows/index.ts
export { useMyWorkflow } from './my-workflow/useMyWorkflow';
export { useMyWorkflowAdapter } from './adapters/useWorkflowAdapter';
```

### Step 4: Create workflow page

```typescript
// app/workflows/my-workflow/page.clean.tsx
import { useMyWorkflowAdapter, ... } from '@/hooks/workflows';

const config: WorkflowPageConfig<MySettingsType> = {
  name: 'My Workflow',
  hooks: {
    useGenerate: useMyWorkflowAdapter,
    useEnhance: usePromptEnhancerAdapter,
    // ...
  }
};
```

## Benefits of This Structure

### 1. **Clear Separation of Concerns**
- Common hooks are easily identifiable
- Workflow-specific hooks are isolated
- Adapters are in their own category

### 2. **Better Discoverability**
- New developers can quickly understand the codebase
- Related hooks are grouped together
- Clear naming conventions

### 3. **Easier Maintenance**
- Changes to shared functionality only affect `common/`
- Workflow changes are isolated to their subdirectory
- Adapter logic is centralized

### 4. **Scalability**
- Adding new workflows is straightforward
- No naming conflicts between workflows
- Consistent pattern for all workflows

### 5. **Type Safety**
- All workflows use shared `ImageData` type from `@/types/workflows/common`
- Prevents format mismatches (like the bug we fixed!)
- TypeScript catches errors at compile time

## Migration from Old Structure

### Old (Flat) Structure
```
hooks/workflows/
├── useBranding.ts
├── useSketchToRender.ts
├── usePromptEnhancer.ts
├── useRenderEdit.ts
├── useUpscale.ts
├── useImageCrop.ts
├── useRecentGenerations.ts
├── useWorkflowLightbox.ts
├── useWorkflowState.ts
├── useWorkflowGeneration.ts
├── useWorkflowHandlers.ts
└── useWorkflowAdapter.ts
```

### New (Organized) Structure
```
hooks/workflows/
├── common/           # Shared hooks
├── sketch-to-render/ # Workflow-specific
├── branding/         # Workflow-specific
├── adapters/         # Adapter layer
└── index.ts          # Central exports
```

## Troubleshooting

### Import Errors After Refactoring

If you see import errors like:
```
Module not found: Can't resolve '@/hooks/workflows/useBranding'
```

**Solution:** Update import to use central export:
```typescript
// ❌ Old
import { useBranding } from '@/hooks/workflows/useBranding';

// ✅ New
import { useBranding } from '@/hooks/workflows';
```

### 500 Errors After Moving Files

If the server shows 500 errors:
1. Check that all imports in moved files are updated
2. Restart the dev server: `npm run dev`
3. Clear Next.js cache: `rm -rf .next`

### Type Errors in Adapters

If you see `ImageData` type mismatches:
1. Ensure you're importing from `@/types/workflows/common`
2. Use `file` and `preview` properties (NOT `data` or `mimeType`)
3. Review the [Workflow Adapter Guide](../../docs/WORKFLOW_ADAPTER_GUIDE.md)

## Related Documentation

- [Workflow Adapter Guide](../../docs/WORKFLOW_ADAPTER_GUIDE.md) - Detailed adapter patterns and best practices
- [Workflow Refactoring](../../docs/WORKFLOW_REFACTORING.md) - History of clean architecture implementation
- [Common Types](../../types/workflows/common.ts) - Shared TypeScript types

## Questions?

If you have questions about this structure or need help adding a new workflow, check:
1. This README
2. The [Workflow Adapter Guide](../../docs/WORKFLOW_ADAPTER_GUIDE.md)
3. Existing workflow implementations as examples

---

**Last Updated:** 2025-10-17
**Restructured By:** Workflow refactoring initiative
