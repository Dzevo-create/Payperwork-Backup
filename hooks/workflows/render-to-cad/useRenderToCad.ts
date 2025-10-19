// hooks/workflows/render-to-cad/useRenderToCad.ts
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { RenderToCadSettingsType } from "@/types/workflows/renderToCadSettings";
import type { ImageData, GenerationResult, WorkflowHookOptions } from "@/types/workflows/common";

interface UseRenderToCadOptions extends WorkflowHookOptions {}

export function useRenderToCad(options: UseRenderToCadOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentResult, setCurrentResult] = useState<GenerationResult | null>(null);

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
      settings: RenderToCadSettingsType
    ): Promise<GenerationResult | null> => {
      // Validation: Render-to-CAD requires source image (rendering/photo)
      if (!sourceImage?.preview) {
        const errorMsg = "Ausgangsbild (Rendering/Foto) ist erforderlich";
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return null;
      }

      setIsGenerating(true);
      setError(null);
      setProgress(0);
      setCurrentResult(null);

      try {
        setProgress(10);

        const sourceBase64 = sourceImage.preview.split(",")[1] || '';
        const sourceMimeType = sourceImage.preview.split(";")[0]?.split(":")[1] || 'image/jpeg';

        const payload = {
          prompt: prompt.trim(),
          sourceImage: {
            data: sourceBase64,
            mimeType: sourceMimeType,
          },
          settings,
        };

        setProgress(20);

        const response = await fetch("/api/render-to-cad", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        setProgress(60);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "CAD-Konvertierung fehlgeschlagen");
        }

        const data = await response.json();

        setProgress(80);

        const imageDataUrl = `data:${data.image.mimeType};base64,${data.image.data}`;

        const result: GenerationResult = {
          imageUrl: imageDataUrl,
          prompt: prompt.trim(),
          model: data.model || "gemini-2.0-flash-exp",
          settings,
          metadata: data.metadata || {},
        };

        setProgress(100);
        setCurrentResult(result);
        setIsGenerating(false);

        onSuccessRef.current?.(result);

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unbekannter Fehler";
        console.error("Render-to-CAD generation error:", err);
        setError(errorMessage);
        setIsGenerating(false);
        setProgress(0);
        onErrorRef.current?.(errorMessage);
        return null;
      }
    },
    []
  );

  return {
    generate,
    isGenerating,
    error,
    progress,
    currentResult,
  };
}
