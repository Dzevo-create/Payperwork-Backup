"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { workflowLogger } from '@/lib/logger';

interface UseUpscaleOptions {
  onSuccess?: (upscaledImageUrl: string) => void;
  onError?: (error: string) => void;
}

interface UpscaleSettings {
  sharpen?: number; // 0-100, default 50
  smart_grain?: number; // 0-100, default 7
  ultra_detail?: number; // 0-100, default 30
}

/**
 * useUpscale Hook
 *
 * Handles upscaling of images using Freepik Magnific API
 * Uses task-based polling to wait for completion
 */
export function useUpscale(options: UseUpscaleOptions = {}) {
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);

  // Polling control
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use refs to avoid re-creating callback on every render
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);

  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onSuccess, options.onError]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * Poll task status until completion
   */
  const pollTaskStatus = useCallback(
    async (taskId: string): Promise<string | null> => {
      return new Promise((resolve, reject) => {
        let pollCount = 0;
        const maxPolls = 60; // Max 5 minutes (60 * 5 seconds)

        pollingIntervalRef.current = setInterval(async () => {
          pollCount++;

          try {
            const response = await fetch(
              `/api/sketch-to-render/upscale?task_id=${taskId}`
            );

            if (!response.ok) {
              throw new Error("Fehler beim Abrufen des Task-Status");
            }

            const data = await response.json();

            workflowLogger.debug('[Upscale] Poll response:', {
              pollCount,
              status: data.status,
              hasGenerated: !!data.generated,
              generatedLength: Array.isArray(data.generated) ? data.generated.length : 0,
              generated: data.generated,
              fullData: data,
            });

            // Update progress based on status (check multiple possible status values)
            const statusUpper = data.status?.toUpperCase();
            if (statusUpper === "CREATED" || statusUpper === "PENDING") {
              setProgress(Math.min(30 + pollCount, 40)); // 30-40% while waiting
            } else if (statusUpper === "IN_PROGRESS" || statusUpper === "PROCESSING") {
              setProgress(Math.min(50 + pollCount * 2, 90)); // 50-90%
            }

            // Check if completed (try multiple possible completed status names)
            if (statusUpper === "COMPLETED" || statusUpper === "COMPLETE" || statusUpper === "SUCCESS" || statusUpper === "SUCCEEDED") {
              // Get the image URL (try different response structures)
              let imageUrl: string | null = null;

              if (data.generated && Array.isArray(data.generated) && data.generated.length > 0) {
                imageUrl = data.generated[0];
              } else if (data.generated && typeof data.generated === 'string') {
                imageUrl = data.generated;
              } else if (data.image) {
                imageUrl = data.image;
              }

              workflowLogger.debug('[Upscale] Status COMPLETED - checking for image:', {
                hasImageUrl: !!imageUrl,
                imageUrl: imageUrl || "null",
                pollCount,
              });

              // IMPORTANT: Only stop polling if we ACTUALLY have an image URL
              // Sometimes Freepik API returns "COMPLETED" but generated array is still empty
              // This is a race condition in their API - we need to keep polling
              if (imageUrl) {
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                }
                setProgress(100);
                workflowLogger.info('[Upscale] Success! Got image:');
                resolve(imageUrl);
                return;
              } else {
                // Status is COMPLETED but no image yet - keep polling
                workflowLogger.warn('[Upscale] Status COMPLETED but no image URL yet (poll " + pollCount + "/60) - continuing to poll...');
                setProgress(Math.min(90 + pollCount, 95)); // 90-95% while waiting for URL
                // Don't return - continue polling
              }
            }

            // Check if failed
            if (data.status === "FAILED") {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
              }
              workflowLogger.error('[Upscale] Task failed:');

              let errorMessage = "Upscaling fehlgeschlagen - Freepik API hat den Task abgelehnt.";

              // Add API error details if available
              if (data.error) {
                errorMessage += `\n\nAPI Error: ${data.error}`;
              }

              errorMessage += "\n\nMögliche Gründe:\n" +
                "• Keine Credits im Freepik Account verfügbar\n" +
                "• Inaktive oder abgelaufene Subscription\n" +
                "• Ungültiger API Key\n" +
                "• Bildformat oder -größe nicht unterstützt\n\n" +
                "Bitte überprüfe deinen Freepik Account und API Key.";

              reject(new Error(errorMessage));
              return;
            }

            // Check if max polls reached
            if (pollCount >= maxPolls) {
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
              }
              reject(new Error("Upscaling Timeout - bitte später erneut versuchen"));
              return;
            }
          } catch (err) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            reject(err);
          }
        }, 5000); // Poll every 5 seconds
      });
    },
    []
  );

  /**
   * Start upscaling process
   */
  const upscale = useCallback(
    async (
      imageUrl: string,
      settings: UpscaleSettings = {}
    ): Promise<string | null> => {
      // Validation
      if (!imageUrl) {
        const errorMsg = "Bild ist erforderlich";
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return null;
      }

      setIsUpscaling(true);
      setError(null);
      setProgress(0);
      setTaskId(null);

      // Abort any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        // Progress: Converting and compressing image
        setProgress(10);

        // Convert image URL to base64 with compression
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // Compress image to reduce size (Freepik has file size limits)
        // IMPORTANT: Try PNG first as Freepik might not process JPEG properly
        const compressedBlob = await new Promise<Blob>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Canvas context not available"));
              return;
            }

            // Limit max width to 1920px to reduce file size
            const maxWidth = 1920;
            const scale = img.width > maxWidth ? maxWidth / img.width : 1;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Convert to JPEG with 0.92 quality for better compression
            canvas.toBlob(
              (compressedBlob) => {
                if (compressedBlob) {
                  resolve(compressedBlob);
                } else {
                  reject(new Error("Compression failed"));
                }
              },
              "image/jpeg",
              0.92
            );
          };
          img.onerror = reject;
          img.src = URL.createObjectURL(blob);
        });

        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(compressedBlob);
        });

        const mimeType = "image/jpeg"; // Always use JPEG after compression

        // Progress: Creating upscale task
        setProgress(20);

        // Prepare request payload
        const payload = {
          image: {
            data: base64Data,
            mimeType,
          },
          sharpen: settings.sharpen ?? 50,
          smart_grain: settings.smart_grain ?? 7,
          ultra_detail: settings.ultra_detail ?? 30,
        };

        // Call upscale API to create task
        const apiResponse = await fetch("/api/sketch-to-render/upscale", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: abortControllerRef.current.signal,
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || "Upscaling fehlgeschlagen");
        }

        const data = await apiResponse.json();
        const newTaskId = data.task_id;

        workflowLogger.debug('[Upscale] Task created:', {
          task_id: newTaskId,
          status: data.status,
        });

        setTaskId(newTaskId);

        // Progress: Waiting for completion
        setProgress(30);

        // Poll for completion
        workflowLogger.debug('[Upscale] Starting polling for task:');
        const upscaledImageUrl = await pollTaskStatus(newTaskId);

        if (!upscaledImageUrl) {
          throw new Error("Kein upscaliertes Bild erhalten");
        }

        setProgress(100);
        onSuccessRef.current?.(upscaledImageUrl);

        return upscaledImageUrl;
      } catch (err) {
        // Don't treat abort as error
        if (err instanceof Error && err.name === "AbortError") {
          return null;
        }

        const errorMsg =
          err instanceof Error ? err.message : "Unbekannter Fehler beim Upscaling";
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        return null;
      } finally {
        setIsUpscaling(false);
        // Reset progress after a short delay
        setTimeout(() => setProgress(0), 1000);
      }
    },
    [pollTaskStatus]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cancelUpscale = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsUpscaling(false);
    setProgress(0);
  }, []);

  return {
    upscale,
    isUpscaling,
    error,
    progress,
    taskId,
    clearError,
    cancelUpscale,
  };
}
