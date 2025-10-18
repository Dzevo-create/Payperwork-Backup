'use client';

import { useCallback } from 'react';
import { workflowLogger } from '@/lib/logger';
import type { WorkflowState } from './useWorkflowState';
import type { Generation } from './useRecentGenerations';
import type { UseDatabaseSave } from './useDatabaseSave';

export interface VideoCreationConfig {
  workflowName: string;
  generateFilename: () => string;
}

export interface UseVideoCreation {
  handleCreateVideo: (videoPrompt: string, duration?: 5 | 10) => Promise<void>;
}

/**
 * Hook for creating videos from workflow results
 * Integrates with Runway Gen-4 Turbo for video generation from images
 */
export function useVideoCreation<TSettings extends Record<string, unknown>>(
  config: VideoCreationConfig,
  workflowState: WorkflowState<TSettings>,
  setRecentGenerations: (fn: (prev: Generation[]) => Generation[]) => void,
  setCurrentSourceImage: (image: string | null) => void,
  setRenderName: (name: string) => void,
  setIsGeneratingVideo: (generating: boolean) => void,
  databaseSave: UseDatabaseSave
): UseVideoCreation {
  const handleCreateVideo = useCallback(async (videoPrompt: string, duration: 5 | 10 = 5) => {
    if (!workflowState.resultImage) {
      alert("Kein Bild zum Verarbeiten vorhanden");
      return;
    }

    if (!videoPrompt.trim()) {
      alert("Bitte gib einen Video-Prompt ein");
      return;
    }

    setIsGeneratingVideo(true);

    try {
      const cameraMovements = [
        "push in", "push out", "pan left", "pan right", "pan up", "pan down",
        "orbit left", "orbit right", "crane up", "crane down",
        "dolly in", "dolly out", "tilt up", "tilt down",
        "zoom in", "zoom out", "static camera"
      ];

      let cameraMovement = "none";
      for (const movement of cameraMovements) {
        if (videoPrompt.toLowerCase().includes(movement)) {
          cameraMovement = movement;
          break;
        }
      }

      workflowLogger.debug(`[${config.workflowName}] Starting Runway video generation...`, { duration });

      const response = await fetch("/api/generate-runway-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: workflowState.resultImage,
          prompt: videoPrompt,
          cameraMovement,
          duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Video-Generierung fehlgeschlagen");
      }

      const data = await response.json();
      const autoName = config.generateFilename().replace("sketchtorender", "v.turbo");
      const previousImage = workflowState.resultImage;

      workflowState.setResultImage(data.videoUrl);
      workflowState.setResultMediaType("video");
      setRenderName(autoName);
      setCurrentSourceImage(previousImage);

      const newGeneration: Generation = {
        id: data.taskId || Date.now().toString(),
        imageUrl: data.videoUrl,
        timestamp: new Date(),
        name: autoName,
        prompt: videoPrompt,
        type: "video",
        sourceType: "from_render",
        settings: workflowState.settings,
      };

      setRecentGenerations((prev) => [newGeneration, ...prev]);

      await databaseSave.saveGenerationToDb({
        url: data.videoUrl,
        type: "video",
        name: autoName,
        prompt: videoPrompt,
        sourceType: "from_render",
        settings: workflowState.settings,
        sourceImage: previousImage || undefined,
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
      alert("Video erfolgreich erstellt! ✨");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      workflowLogger.error(`[${config.workflowName}] Video generation error:`, error instanceof Error ? error : new Error(String(error)));
      alert(`Video-Generierung fehlgeschlagen: ${errorMessage}`);
    } finally {
      setIsGeneratingVideo(false);
    }
  }, [config, workflowState, setRecentGenerations, setCurrentSourceImage, setRenderName, setIsGeneratingVideo, databaseSave]);

  return {
    handleCreateVideo,
  };
}
