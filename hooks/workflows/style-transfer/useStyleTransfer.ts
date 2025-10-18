// hooks/workflows/style-transfer/useStyleTransfer.ts
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { StyleTransferSettingsType } from "@/types/workflows/styleTransferSettings";
import type { ImageData, GenerationResult, WorkflowHookOptions } from "@/types/workflows/common";

interface UseStyleTransferOptions extends WorkflowHookOptions {}

export function useStyleTransfer(options: UseStyleTransferOptions = {}) {
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
      settings: StyleTransferSettingsType,
      referenceImage?: ImageData
    ): Promise<GenerationResult | null> => {
      // Validation: Style-Transfer requires source image (reference image is optional)
      if (!sourceImage?.preview) {
        const errorMsg = "Ausgangsbild (Design) ist erforderlich";
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

        const payload: any = {
          prompt: prompt.trim(),
          sourceImage: {
            data: sourceBase64,
            mimeType: sourceMimeType,
          },
          settings,
        };

        // Add reference image only if provided
        if (referenceImage?.preview) {
          const refBase64 = referenceImage.preview.split(",")[1] || '';
          const refMimeType = referenceImage.preview.split(";")[0]?.split(":")[1] || 'image/jpeg';
          payload.referenceImage = {
            data: refBase64,
            mimeType: refMimeType,
          };
        }

        setProgress(20);

        const response = await fetch("/api/style-transfer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        setProgress(60);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Generierung fehlgeschlagen");
        }

        const data = await response.json();

        setProgress(80);

        const imageDataUrl = `data:${data.image.mimeType};base64,${data.image.data}`;

        const result: GenerationResult = {
          id: `style-transfer-${Date.now()}`,
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
