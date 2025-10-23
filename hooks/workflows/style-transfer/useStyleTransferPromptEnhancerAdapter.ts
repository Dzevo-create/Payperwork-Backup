"use client";

import { useCallback, useContext } from "react";
import { StyleTransferContext } from "@/contexts/StyleTransferContext";
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
  const context = useContext(StyleTransferContext);

  if (!context) {
    throw new Error(
      "useStyleTransferPromptEnhancerAdapter must be used within StyleTransferProvider"
    );
  }

  const { sourceImage, referenceImage, settings } = context;
  const { enhancePrompt, isEnhancing, error, clearError } = useStyleTransferPromptEnhancer();

  const enhance = useCallback(
    async (prompt: string): Promise<string> => {
      if (!sourceImage?.file || !sourceImage?.preview) {
        throw new Error("Source image is required for prompt enhancement");
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
