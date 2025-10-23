"use client";

import { useCallback } from "react";
import { StyleTransferSettingsType } from "@/types/workflows/styleTransferSettings";
import { useStyleTransferPromptEnhancer } from "./useStyleTransferPromptEnhancer";

interface ImageData {
  file: File | null;
  preview: string | null;
}

/**
 * useStyleTransferPromptEnhancerAdapter
 *
 * Adapter for Style Transfer-specific T-Button
 * Returns a function that matches the WorkflowPage interface
 *
 * Usage in page.clean.tsx:
 * ```
 * useEnhance: () => useStyleTransferPromptEnhancerAdapter()
 * ```
 */
export function useStyleTransferPromptEnhancerAdapter() {
  const { enhancePrompt, isEnhancing, error, metadata, clearError } =
    useStyleTransferPromptEnhancer();

  const enhance = useCallback(
    async (
      prompt: string,
      sourceImage: ImageData,
      settings: StyleTransferSettingsType,
      referenceImage?: ImageData
    ): Promise<string> => {
      const result = await enhancePrompt(prompt, sourceImage, settings, referenceImage);
      return result || prompt; // Fallback to original prompt if enhancement fails
    },
    [enhancePrompt]
  );

  return {
    enhance,
    isEnhancing,
    error,
    metadata,
    clearError,
  };
}
