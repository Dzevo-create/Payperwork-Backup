"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SketchToRenderSettingsType } from "@/types/workflows/sketchToRenderSettings";
import type { ImageData, GenerationResult, WorkflowHookOptions } from "@/types/workflows/common";

// Legacy alias for backwards compatibility
interface UseSketchToRenderOptions extends WorkflowHookOptions {}

/**
 * useSketchToRender Hook
 *
 * Handles main "Generate" functionality for Sketch-to-Render workflow
 * Calls /api/sketch-to-render to generate photorealistic renderings
 */
export function useSketchToRender(options: UseSketchToRenderOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentResult, setCurrentResult] = useState<GenerationResult | null>(null);

  // Use refs to avoid re-creating callback on every render
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onSuccess, options.onError]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const generate = useCallback(
    async (
      prompt: string,
      sourceImage: ImageData,
      settings: SketchToRenderSettingsType,
      referenceImage?: ImageData
    ): Promise<GenerationResult | null> => {
      // Validation - only check preview (file is not needed for generation)
      if (!sourceImage?.preview) {
        const errorMsg = "Ausgangsbild ist erforderlich";
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return null;
      }

      // Note: Prompt is optional - T-Button can generate prompt from image
      // Allow empty prompt for image-only generation

      setIsGenerating(true);
      setError(null);
      setProgress(0);
      setCurrentResult(null);

      try {
        // Progress: Starting request
        setProgress(10);

        // Convert source image to base64 data
        const sourceBase64 = sourceImage.preview.split(",")[1] || '';
        const sourceMimeType = sourceImage.preview.split(";")[0]?.split(":")[1] || 'image/jpeg';

        // Prepare request payload
        const payload: {
          prompt: string;
          sourceImage: { data: string; mimeType: string };
          settings: SketchToRenderSettingsType;
          referenceImage?: { data: string; mimeType: string };
        } = {
          prompt: prompt.trim(),
          sourceImage: {
            data: sourceBase64,
            mimeType: sourceMimeType,
          },
          settings,
        };

        // Add reference image if provided
        if (referenceImage?.preview) {
          const refBase64 = referenceImage.preview.split(",")[1] || '';
          const refMimeType = referenceImage.preview.split(";")[0]?.split(":")[1] || 'image/jpeg';
          payload.referenceImage = {
            data: refBase64,
            mimeType: refMimeType,
          };
        }

        // Progress: Sending request
        setProgress(20);

        // Call main generation API
        const response = await fetch("/api/sketch-to-render", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        // Progress: Processing response
        setProgress(60);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Generierung fehlgeschlagen");
        }

        const data = await response.json();

        // Progress: Creating result
        setProgress(80);

        // Convert base64 image to data URL
        const imageDataUrl = `data:${data.image.mimeType};base64,${data.image.data}`;

        // Create result object
        const result: GenerationResult = {
          id: `render-${Date.now()}`,
          imageUrl: imageDataUrl,
          timestamp: new Date(data.metadata.timestamp),
          prompt: data.metadata.prompt || undefined,
          enhancedPrompt: data.metadata.enhancedPrompt,
          settings: data.metadata.settings || undefined,
        };

        setProgress(100);
        setCurrentResult(result);
        onSuccessRef.current?.(result);

        return result;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unbekannter Fehler bei der Generierung";
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return null;
      } finally {
        setIsGenerating(false);
        // Reset progress after a short delay
        timeoutRef.current = setTimeout(() => setProgress(0), 1000);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setCurrentResult(null);
  }, []);

  return {
    generate,
    isGenerating,
    error,
    progress,
    currentResult,
    clearError,
    clearResult,
  };
}
