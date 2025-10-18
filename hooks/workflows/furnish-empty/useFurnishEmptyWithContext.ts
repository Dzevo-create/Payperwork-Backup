/**
 * Furnish-Empty Adapter with Context Support
 *
 * This adapter wraps useFurnishEmpty and adds furniture images from context.
 * Must be used within FurnishEmptyProvider.
 */

"use client";

import { useFurnishEmpty } from './useFurnishEmpty';
import { useFurnishEmptyContext } from '@/contexts/FurnishEmptyContext';
import type { FurnishEmptySettingsType } from '@/types/workflows/furnishEmptySettings';
import type { ImageData, GenerationResult } from '@/types/workflows/common';

export function useFurnishEmptyWithContext() {
  const hook = useFurnishEmpty();
  const { furnitureImages } = useFurnishEmptyContext();

  return {
    ...hook,
    generate: async (
      prompt: string,
      sourceImage: ImageData,
      settings: FurnishEmptySettingsType,
      referenceImage?: ImageData
    ): Promise<GenerationResult | null> => {
      // Call original generate with furniture images from context
      return hook.generate(prompt, sourceImage, settings, referenceImage, furnitureImages);
    },
  };
}
