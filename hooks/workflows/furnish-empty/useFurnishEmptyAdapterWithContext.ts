/**
 * Furnish-Empty Adapter with Context for WorkflowPage
 *
 * This adapter provides the StandardGenerateHook interface while using
 * the furniture images from context.
 */

"use client";

import { useFurnishEmptyWithContext } from './useFurnishEmptyWithContext';
import type { FurnishEmptySettingsType } from '@/types/workflows/furnishEmptySettings';
import type { StandardGenerateHook } from '../adapters/useWorkflowAdapter';

export function useFurnishEmptyAdapterWithContext(): StandardGenerateHook<FurnishEmptySettingsType> {
  const hook = useFurnishEmptyWithContext();

  return {
    generate: async (params) => {
      const { prompt, settings, sourceImage, referenceImages } = params;

      // Convert base64 preview string to ImageData format
      const sourceImageData: { file: File | null; preview: string | null } = sourceImage ? {
        file: null,
        preview: sourceImage,
      } : { file: null, preview: null };

      const referenceImageData: { file: File | null; preview: string | null } | undefined = referenceImages.length > 0 ? {
        file: null,
        preview: referenceImages[0] || null,
      } : undefined;

      const result = await hook.generate(
        prompt,
        sourceImageData as any,
        settings as FurnishEmptySettingsType,
        referenceImageData as any
      );

      return result;
    },
    isGenerating: hook.isGenerating,
    error: hook.error,
    progress: hook.progress,
  };
}
