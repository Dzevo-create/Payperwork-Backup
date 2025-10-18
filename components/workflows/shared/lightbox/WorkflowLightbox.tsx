/**
 * WorkflowLightbox Component
 *
 * Main lightbox orchestrator for displaying workflow results with navigation and metadata.
 */

"use client";

import { useEffect, useRef } from "react";
import { workflowLogger } from "@/lib/logger";
import { SketchToRenderSettingsType } from "@/types/workflows/sketchToRenderSettings";
import { LightboxImage } from "./LightboxImage";
import { LightboxNavigation } from "./LightboxNavigation";
import { LightboxMetadata } from "./LightboxMetadata";

interface RenderItem {
  id: string;
  imageUrl: string;
  timestamp: Date;
  name?: string;
  prompt?: string;
  enhancedPrompt?: string;
  settings?: SketchToRenderSettingsType;
  type?: "image" | "video" | "render" | "upscale";
  sourceImageUrl?: string;
}

interface WorkflowLightboxProps {
  isOpen: boolean;
  item: RenderItem;
  onClose: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  onDownload?: (item: RenderItem) => void;
}

export function WorkflowLightbox({
  isOpen,
  item,
  onClose,
  onNavigate,
  hasNext,
  hasPrev,
  onDownload,
}: WorkflowLightboxProps) {
  const downloadAbortControllerRef = useRef<AbortController | null>(null);

  // Guard: Return early if item is undefined
  if (!item) {
    return null;
  }

  // Debug: Log item data
  useEffect(() => {
    if (isOpen) {
      workflowLogger.debug("[Lightbox] Item data:", {
        type: item.type,
        hasSourceImage: !!item.sourceImageUrl,
        sourceImageUrl: item.sourceImageUrl?.substring(0, 50) + "...",
        name: item.name,
      });
    }
  }, [isOpen, item]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrev && onNavigate) {
        onNavigate("prev");
      } else if (e.key === "ArrowRight" && hasNext && onNavigate) {
        onNavigate("next");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNavigate, hasNext, hasPrev]);

  // Prevent body scroll when lightbox is open & cleanup
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      if (downloadAbortControllerRef.current) {
        downloadAbortControllerRef.current.abort();
      }
    };
  }, [isOpen]);

  const handleDownloadClick = async () => {
    if (onDownload) {
      // Use parent's download function if provided
      onDownload(item);
    } else {
      // Fallback to download with fetch and AbortController
      if (!item.imageUrl) return;

      try {
        downloadAbortControllerRef.current = new AbortController();

        const response = await fetch(item.imageUrl, {
          signal: downloadAbortControllerRef.current.signal,
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const extension = item.type === "video" ? ".mp4" : ".jpg";
        a.download = `${item.name || `render-${item.id}`}${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        downloadAbortControllerRef.current = null;
      } catch (error: unknown) {
        if (error instanceof Error && error.name === "AbortError") {
          workflowLogger.debug("Download aborted");
          return;
        }
        workflowLogger.error(
          "Download failed:",
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-pw-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <LightboxNavigation
        onClose={onClose}
        onNavigate={onNavigate}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />

      {/* Main Content */}
      <div className="flex items-center justify-center gap-8 h-full w-full px-20 py-16">
        <LightboxImage imageUrl={item.imageUrl} />
        <LightboxMetadata item={item} onDownload={handleDownloadClick} />
      </div>
    </div>
  );
}
