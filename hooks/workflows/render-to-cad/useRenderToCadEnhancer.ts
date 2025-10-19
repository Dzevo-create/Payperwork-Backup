"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { RenderToCadSettingsType } from "@/types/workflows/renderToCadSettings";

interface ImageData {
  file: File | null;
  preview: string | null;
}

interface UseRenderToCadEnhancerOptions {
  onSuccess?: (enhancedPrompt: string) => void;
  onError?: (error: string) => void;
}

interface EnhancePromptMetadata {
  generatedAt: string;
  hadUserInput: boolean;
  usedSettings: boolean;
}

/**
 * useRenderToCadEnhancer Hook
 *
 * Handles T-Button functionality for Render-to-CAD workflow
 * Calls /api/render-to-cad/generate-prompt to analyze images and generate CAD prompts
 */
export function useRenderToCadEnhancer(options: UseRenderToCadEnhancerOptions = {}) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<EnhancePromptMetadata | null>(null);

  // Use refs to avoid re-creating callback on every render
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onSuccess, options.onError]);

  const enhancePrompt = useCallback(
    async (
      userPrompt: string,
      sourceImage: ImageData,
      settings: RenderToCadSettingsType
    ): Promise<string | null> => {
      // Validation
      if (!sourceImage.file || !sourceImage.preview) {
        const errorMsg = "Ausgangsbild ist erforderlich für Prompt-Generierung";
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return null;
      }

      setIsEnhancing(true);
      setError(null);
      setMetadata(null);

      try {
        // Convert source image to base64 data
        const sourcePreviewParts = sourceImage.preview?.split(",");
        const sourceBase64 = sourcePreviewParts?.[1];
        const sourceMimeParts = sourceImage.preview?.split(";")[0]?.split(":");
        const sourceMimeType = sourceMimeParts?.[1];

        if (!sourceBase64 || !sourceMimeType) {
          throw new Error("Ungültiges Bildformat");
        }

        // Prepare request payload
        const payload = {
          userPrompt: userPrompt || "",
          sourceImage: {
            data: sourceBase64,
            mimeType: sourceMimeType,
          },
          settings,
        };

        // Call T-Button API for Render-to-CAD
        const response = await fetch("/api/render-to-cad/generate-prompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Prompt-Generierung fehlgeschlagen");
        }

        const data = await response.json();
        const enhancedPrompt = data.enhancedPrompt;

        setMetadata(data.metadata);
        onSuccessRef.current?.(enhancedPrompt);

        return enhancedPrompt;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unbekannter Fehler";
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
        return null;
      } finally {
        setIsEnhancing(false);
      }
    },
    []
  );

  return {
    enhancePrompt,
    isEnhancing,
    error,
    metadata,
  };
}
