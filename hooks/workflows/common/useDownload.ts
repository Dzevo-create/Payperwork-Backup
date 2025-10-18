'use client';

import { useCallback } from 'react';
import { workflowLogger } from '@/lib/logger';
import type { WorkflowState } from './useWorkflowState';

export interface UseDownload {
  handleDownload: (imageUrl?: string, filename?: string, mediaType?: "image" | "video") => Promise<void>;
}

/**
 * Hook for downloading workflow results
 * Handles both image and video downloads with proper MIME types and fallbacks
 */
export function useDownload<TSettings extends Record<string, unknown>>(
  workflowState: WorkflowState<TSettings>,
  renderName: string
): UseDownload {
  const handleDownload = useCallback(async (imageUrl?: string, filename?: string, mediaType?: "image" | "video") => {
    const urlToDownload = imageUrl || workflowState.resultImage;
    const type = mediaType || workflowState.resultMediaType;

    if (!urlToDownload || typeof urlToDownload !== 'string') {
      workflowLogger.error('[Download] No valid URL to download', new Error(`Invalid URL: ${typeof urlToDownload}`));
      return;
    }

    workflowLogger.debug('[Download] Starting download:', {
      type,
      mediaType,
      resultMediaType: workflowState.resultMediaType,
      urlContainsMp4: urlToDownload.includes(".mp4"),
      url: urlToDownload.substring(0, 100)
    });

    try {
      let extension = ".jpg";
      if (type === "video" || urlToDownload.includes(".mp4")) {
        extension = ".mp4";
      } else if (urlToDownload.includes(".png") || urlToDownload.startsWith("data:image/png")) {
        extension = ".png";
      }

      const downloadName = filename || `${renderName || `render-${Date.now()}`}${extension}`;

      if (type === "video" || urlToDownload.startsWith("http")) {
        const response = await fetch(urlToDownload);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        let blob = await response.blob();
        if (type === "video" || extension === ".mp4") {
          if (!blob.type.includes("video")) {
            blob = new Blob([blob], { type: "video/mp4" });
          }
        }

        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = downloadName;
        link.setAttribute("type", blob.type);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      } else {
        const link = document.createElement("a");
        link.href = urlToDownload;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      workflowLogger.error('[Download] Download failed:', error as Error);
      alert("Download fehlgeschlagen. Bitte versuche es erneut.");
    }
  }, [workflowState, renderName]);

  return {
    handleDownload,
  };
}
