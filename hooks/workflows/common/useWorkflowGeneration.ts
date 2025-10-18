import { useState, useCallback, useRef, useEffect } from "react";
import { RenderSettingsType } from "@/types/workflows/renderSettings";

/**
 * Shared types and utilities for workflow generation hooks
 * Eliminates duplication across useSketchToRender, useBranding, etc.
 */

export interface ImageData {
  file: File | null;
  preview: string | null;
}

export interface GenerationResult {
  id: string;
  imageUrl: string;
  timestamp: Date;
  prompt?: string;
  enhancedPrompt?: string;
  settings?: RenderSettingsType;
}

export interface UseGenerationOptions {
  onSuccess?: (result: GenerationResult) => void;
  onError?: (error: string) => void;
}

export interface GenerationMetadata {
  prompt: string | null;
  enhancedPrompt: string;
  settings: RenderSettingsType | null;
  timestamp: string;
  model: string;
}

/**
 * Base state management for workflow generation hooks
 */
export function useGenerationState() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentResult, setCurrentResult] = useState<GenerationResult | null>(null);

  const resetState = useCallback(() => {
    setIsGenerating(false);
    setError(null);
    setProgress(0);
  }, []);

  const startGeneration = useCallback(() => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setCurrentResult(null);
  }, []);

  const finishGeneration = useCallback(() => {
    setIsGenerating(false);
    setProgress(100);
  }, []);

  const setGenerationError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsGenerating(false);
    setProgress(0);
  }, []);

  return {
    isGenerating,
    error,
    progress,
    currentResult,
    setProgress,
    setCurrentResult,
    resetState,
    startGeneration,
    finishGeneration,
    setGenerationError,
  };
}

/**
 * Shared callback refs management
 */
export function useCallbackRefs(options: UseGenerationOptions) {
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

  return { onSuccessRef, onErrorRef, timeoutRef };
}

/**
 * Validate generation inputs
 */
export function validateGenerationInputs(
  prompt: string,
  sourceImage: ImageData,
  onError?: (error: string) => void
): boolean {
  if (!sourceImage.file || !sourceImage.preview) {
    const errorMsg = "Ausgangsbild ist erforderlich";
    onError?.(errorMsg);
    return false;
  }

  if (!prompt.trim()) {
    const errorMsg = "Prompt ist erforderlich";
    onError?.(errorMsg);
    return false;
  }

  return true;
}

/**
 * Convert image to base64 data
 */
export function extractBase64Data(preview: string): { base64: string; mimeType: string } {
  const base64 = preview.split(",")[1];
  if (!base64) {
    throw new Error("Invalid preview data: Failed to extract base64");
  }
  const mimeType = preview.split(";")[0]?.split(":")[1];
  if (!mimeType) {
    throw new Error("Invalid preview data: Failed to extract mimeType");
  }
  return { base64, mimeType };
}

/**
 * Build common generation payload
 */
export function buildGenerationPayload(
  prompt: string,
  sourceImage: ImageData,
  settings: RenderSettingsType,
  referenceImage?: ImageData
): {
  prompt: string;
  sourceImage: { data: string; mimeType: string };
  referenceImage?: { data: string; mimeType: string };
  settings: RenderSettingsType;
} {
  const { base64: sourceBase64, mimeType: sourceMimeType } = extractBase64Data(sourceImage.preview!);

  const payload: {
    prompt: string;
    sourceImage: { data: string; mimeType: string };
    referenceImage?: { data: string; mimeType: string };
    settings: RenderSettingsType;
  } = {
    prompt: prompt.trim(),
    sourceImage: {
      data: sourceBase64,
      mimeType: sourceMimeType,
    },
    settings,
  };

  if (referenceImage?.file && referenceImage.preview) {
    const { base64: refBase64, mimeType: refMimeType } = extractBase64Data(referenceImage.preview);
    payload.referenceImage = {
      data: refBase64,
      mimeType: refMimeType,
    };
  }

  return payload;
}

/**
 * Shared API request handler with progress tracking
 */
export async function makeGenerationRequest(
  apiEndpoint: string,
  payload: Record<string, unknown>,
  setProgress: (progress: number) => void
): Promise<Record<string, unknown>> {
  setProgress(20);

  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  setProgress(40);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Fehler bei der Generierung");
  }

  const data = await response.json();
  setProgress(90);

  return data;
}
