"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseRenderEditOptions {
  onSuccess?: (editedImageUrl: string) => void;
  onError?: (error: string) => void;
}

/**
 * useRenderEdit Hook
 *
 * Handles editing/refining of existing renders
 * Calls /api/sketch-to-render/edit to make changes to current image
 */
export function useRenderEdit(options: UseRenderEditOptions = {}) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Use refs to avoid re-creating callback on every render
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileReaderRef = useRef<FileReader | null>(null);

  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onSuccess, options.onError]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (fileReaderRef.current) {
        fileReaderRef.current.abort();
        fileReaderRef.current = null;
      }
    };
  }, []);

  const editRender = useCallback(
    async (
      editPrompt: string,
      currentImageUrl: string,
      originalPrompt?: string,
      referenceImages?: string[]
    ): Promise<string | null> => {
      // Validation
      if (!editPrompt.trim()) {
        const errorMsg = "Edit-Prompt ist erforderlich";
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return null;
      }

      if (!currentImageUrl) {
        const errorMsg = "Aktuelles Bild ist erforderlich";
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return null;
      }

      setIsEditing(true);
      setError(null);
      setProgress(0);

      try {
        // Progress: Converting image
        setProgress(10);

        // Convert image URL to base64
        const response = await fetch(currentImageUrl);
        const blob = await response.blob();
        const reader = new FileReader();

        const base64Data = await new Promise<string>((resolve, reject) => {
          fileReaderRef.current = reader;
          reader.onloadend = () => {
            fileReaderRef.current = null;
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            if (!base64) {
              reject(new Error("Failed to extract base64 data from FileReader result"));
              return;
            }
            resolve(base64);
          };
          reader.onerror = () => {
            fileReaderRef.current = null;
            reject(new Error("FileReader failed to read blob"));
          };
          reader.readAsDataURL(blob);
        });

        const mimeType = blob.type || "image/jpeg";

        // Progress: Sending request
        setProgress(20);

        // Prepare request payload
        const payload: {
          editPrompt: string;
          currentImage: { data: string; mimeType: string };
          originalPrompt?: string;
          referenceImages?: Array<{ data: string; mimeType: string }>;
        } = {
          editPrompt: editPrompt.trim(),
          currentImage: {
            data: base64Data,
            mimeType,
          },
        };

        if (originalPrompt) {
          payload.originalPrompt = originalPrompt;
        }

        // Convert reference images from data URLs to API format
        if (referenceImages && referenceImages.length > 0) {
          payload.referenceImages = referenceImages.map((dataUrl) => {
            // Extract data and mimeType from data URL (data:image/jpeg;base64,...)
            const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
            if (matches && matches[1] && matches[2]) {
              return {
                data: matches[2],
                mimeType: matches[1],
              };
            }
            // Fallback if format is unexpected
            return {
              data: dataUrl.split(',')[1] || dataUrl,
              mimeType: 'image/jpeg',
            };
          });
        }

        // Call edit API
        const apiResponse = await fetch("/api/sketch-to-render/edit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        // Progress: Processing response
        setProgress(60);

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || "Bearbeitung fehlgeschlagen");
        }

        const data = await apiResponse.json();

        // Progress: Creating result
        setProgress(80);

        // Convert base64 image to data URL
        const editedImageUrl = `data:${data.image.mimeType};base64,${data.image.data}`;

        setProgress(100);
        onSuccessRef.current?.(editedImageUrl);

        return editedImageUrl;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Unbekannter Fehler bei der Bearbeitung";
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return null;
      } finally {
        setIsEditing(false);
        // Reset progress after a short delay
        timeoutRef.current = setTimeout(() => setProgress(0), 1000);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    editRender,
    isEditing,
    error,
    progress,
    clearError,
  };
}
