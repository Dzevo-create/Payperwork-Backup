"use client";

import { useCallback } from "react";
import { useStyleTransferContext } from "@/contexts/StyleTransferContext";
import { useStyleTransferPromptEnhancer } from "./useStyleTransferPromptEnhancer";

/**
 * useStyleTransferPromptEnhancerAdapter
 *
 * Adapter for Style Transfer-specific T-Button
 * Returns a function that matches the WorkflowPage StandardEnhanceHook interface
 *
 * This adapter:
 * 1. Gets sourceImage, referenceImage, and settings from StyleTransferContext
 * 2. Calls Style Transfer-specific prompt enhancer
 * 3. Returns enhanced prompt with imperative commands
 *
 * Usage in page.clean.tsx:
 * ```
 * useEnhance: () => useStyleTransferPromptEnhancerAdapter()
 * ```
 */
export function useStyleTransferPromptEnhancerAdapter() {
  const { sourceImage, referenceImage, settings } = useStyleTransferContext();
  const { enhancePrompt, isEnhancing, error, clearError } = useStyleTransferPromptEnhancer();

  const enhance = useCallback(
    async (prompt: string): Promise<string> => {
      // If no source image, return original prompt (T-Button should be disabled, but just in case)
      if (!sourceImage?.file || !sourceImage?.preview) {
        console.warn(
          "Style Transfer T-Button: No source image available, returning original prompt"
        );
        return prompt;
      }

      const result = await enhancePrompt(prompt, sourceImage, settings, referenceImage);
      return result || prompt; // Fallback to original prompt if enhancement fails
    },
    [enhancePrompt, sourceImage, referenceImage, settings]
  );

  return {
    enhance,
    isEnhancing,
    error,
    clearError,
  };
}
