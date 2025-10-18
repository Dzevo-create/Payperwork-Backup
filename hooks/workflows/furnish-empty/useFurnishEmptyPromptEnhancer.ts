"use client";

import { useState, useCallback } from "react";
import { FurnishEmptySettingsType } from "@/types/workflows/furnishEmptySettings";

interface ImageData {
  file: File | null;
  preview: string | null;
}

interface UseFurnishEmptyPromptEnhancerOptions {
  onSuccess?: (enhancedPrompt: string) => void;
  onError?: (error: string) => void;
}

/**
 * useFurnishEmptyPromptEnhancer Hook
 *
 * Handles T-Button functionality for Furnish-Empty workflow
 * Calls /api/furnish-empty/generate-prompt to generate prompts
 */
export function useFurnishEmptyPromptEnhancer(options: UseFurnishEmptyPromptEnhancerOptions = {}) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhancePrompt = useCallback(
    async (
      userPrompt: string,
      sourceImage: ImageData,
      settings: FurnishEmptySettingsType,
      referenceImage?: ImageData
    ): Promise<string | null> => {
      setIsEnhancing(true);
      setError(null);

      try {
        // Convert images to base64 format for API
        const sourceImageData = sourceImage.preview
          ? {
              data: sourceImage.preview.split(',')[1],
              mimeType: 'image/jpeg',
            }
          : null;

        const referenceImageData = referenceImage?.preview
          ? {
              data: referenceImage.preview.split(',')[1],
              mimeType: 'image/jpeg',
            }
          : undefined;

        if (!sourceImageData) {
          throw new Error("Source image is required");
        }

        const response = await fetch("/api/furnish-empty/generate-prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userPrompt: userPrompt || "",
            sourceImage: sourceImageData,
            referenceImage: referenceImageData,
            settings,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const enhancedPrompt = data.enhancedPrompt || userPrompt;

        options.onSuccess?.(enhancedPrompt);
        return enhancedPrompt;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to enhance prompt";
        setError(errorMessage);
        options.onError?.(errorMessage);
        return null;
      } finally {
        setIsEnhancing(false);
      }
    },
    [options]
  );

  return {
    enhancePrompt,
    isEnhancing,
    error,
  };
}
