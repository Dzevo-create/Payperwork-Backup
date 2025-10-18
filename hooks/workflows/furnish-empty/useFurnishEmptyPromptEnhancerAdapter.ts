"use client";

import { useFurnishEmptyPromptEnhancer } from './useFurnishEmptyPromptEnhancer';
import { FurnishEmptySettingsType } from '@/types/workflows/furnishEmptySettings';
import type { StandardEnhanceHook } from '../adapters/useWorkflowAdapter';

/**
 * Adapter for Furnish-Empty Prompt Enhancer Hook
 *
 * Converts useFurnishEmptyPromptEnhancer to StandardEnhanceHook interface
 */
export function useFurnishEmptyPromptEnhancerAdapter(
  sourceImage: string | null,
  settings: FurnishEmptySettingsType
): StandardEnhanceHook {
  const hook = useFurnishEmptyPromptEnhancer();

  return {
    enhance: async (prompt: string) => {
      if (!sourceImage) {
        return prompt; // Can't enhance without source image
      }

      // Convert base64 to File object for validation
      const response = await fetch(sourceImage);
      const blob = await response.blob();
      const file = new File([blob], 'source-image.jpg', { type: 'image/jpeg' });

      // Convert to ImageData format expected by useFurnishEmptyPromptEnhancer
      const sourceImageData = {
        file,
        preview: sourceImage,
      };

      const result = await hook.enhancePrompt(
        prompt,
        sourceImageData,
        settings,
        undefined // No reference image for now
      );

      return result || prompt;
    },
    isEnhancing: hook.isEnhancing,
    error: hook.error,
  };
}
