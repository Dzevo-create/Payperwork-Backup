'use client';

import { useCallback } from 'react';
import type { WorkflowState } from './useWorkflowState';
import type { Generation } from './useRecentGenerations';

export interface UseGenerationLoader {
  handleLoadForEdit: (gen: Generation) => void;
  handleLoadForVideo: (gen: Generation) => void;
}

/**
 * Hook for loading previous generations into the workflow
 * Allows users to edit or create videos from previously generated content
 */
export function useGenerationLoader<TSettings extends Record<string, unknown>>(
  workflowState: WorkflowState<TSettings>,
  setRenderName: (name: string) => void
): UseGenerationLoader {
  // Load generation for editing
  const handleLoadForEdit = useCallback((gen: Generation) => {
    const mediaType = gen.type === "video" ? "video" : "image";

    // Load result image
    workflowState.setResultImage(gen.imageUrl);
    workflowState.setResultMediaType(mediaType);
    setRenderName(gen.name || "");
    workflowState.setOriginalPrompt(gen.prompt || "");

    // Load source image if available
    if (gen.sourceImageUrl) {
      workflowState.setInputData((prev) => ({
        ...prev,
        sourceImage: {
          file: null, // File object not available from URL
          preview: gen.sourceImageUrl || null,
          originalPreview: gen.sourceImageUrl || null,
        },
      }));
    }

    // Load settings if available
    if (gen.settings) {
      workflowState.setSettings(gen.settings as TSettings);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [workflowState, setRenderName]);

  // Load generation for video creation
  const handleLoadForVideo = useCallback((gen: Generation) => {
    const mediaType = gen.type === "video" ? "video" : "image";
    workflowState.setResultImage(gen.imageUrl);
    workflowState.setResultMediaType(mediaType);
    setRenderName(gen.name || "");
    workflowState.setOriginalPrompt(gen.prompt || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [workflowState, setRenderName]);

  return {
    handleLoadForEdit,
    handleLoadForVideo,
  };
}
