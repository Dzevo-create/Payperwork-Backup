"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { BrandingSettingsType } from "@/types/workflows/brandingSettings";

interface ImageData {
  file: File | null;
  preview: string | null;
}

interface UseBrandingPromptEnhancerOptions {
  onSuccess?: (enhancedPrompt: string) => void;
  onError?: (error: string) => void;
}

interface EnhancePromptMetadata {
  generatedAt: string;
  hadUserInput: boolean;
  usedReference: boolean;
  usedSettings: boolean;
  cached: boolean;
}

/**
 * useBrandingPromptEnhancer Hook
 *
 * Handles T-Button functionality for Branding workflow
 * Calls /api/branding/generate-prompt (with Two-Stage Enhancement)
 */
export function useBrandingPromptEnhancer(options: UseBrandingPromptEnhancerOptions = {}) {
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
      settings: BrandingSettingsType,
      referenceImage?: ImageData
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
        const payload: {
          userPrompt: string | null;
          sourceImage: { data: string; mimeType: string };
          settings: BrandingSettingsType;
          referenceImage?: { data: string; mimeType: string };
        } = {
          userPrompt: userPrompt.trim() || null,
          sourceImage: {
            data: sourceBase64,
            mimeType: sourceMimeType,
          },
          settings,
        };

        // Add reference image if provided
        if (referenceImage?.file && referenceImage.preview) {
          const refPreviewParts = referenceImage.preview.split(",");
          const refBase64 = refPreviewParts[1];
          const refMimeParts = referenceImage.preview.split(";")[0]?.split(":");
          const refMimeType = refMimeParts?.[1];

          if (refBase64 && refMimeType) {
            payload.referenceImage = {
              data: refBase64,
              mimeType: refMimeType,
            };
          }
        }

        // Call Branding T-Button API (uses Two-Stage Enhancement)
        const response = await fetch("/api/branding/generate-prompt", {
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
        const errorMsg =
          err instanceof Error ? err.message : "Unbekannter Fehler bei Prompt-Generierung";
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return null;
      } finally {
        setIsEnhancing(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    enhancePrompt,
    isEnhancing,
    error,
    metadata,
    clearError,
  };
}
