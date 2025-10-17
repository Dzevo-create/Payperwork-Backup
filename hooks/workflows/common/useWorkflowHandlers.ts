'use client';

import { useCallback } from 'react';
import { workflowLogger } from '@/lib/logger';
import { getUserIdSync } from '@/lib/supabase/insert-helper';
import { uploadBase64Image, uploadFile } from '@/lib/supabase-library';
import type { WorkflowState } from './useWorkflowState';
import type { Generation } from './useRecentGenerations';

export interface WorkflowHandlersConfig {
  apiEndpoint: string;
  workflowName: string;
  generateFilename: () => string;
}

export interface UseWorkflowHandlers {
  // Save to database
  saveGenerationToDb: (generation: {
    url: string;
    type: "render" | "video" | "upscale";
    name: string;
    prompt?: string;
    sourceType?: "original" | "from_render" | "from_video";
    parentId?: string;
    settings?: any;
    sourceImage?: string;
  }) => Promise<void>;

  // Success handlers
  handleGenerateSuccess: (result: any) => Promise<void>;
  handleEditSuccess: (editedImageUrl: string) => Promise<void>;
  handleUpscaleSuccess: (upscaledImageUrl: string) => Promise<void>;

  // Action handlers
  handleDownload: (imageUrl?: string, filename?: string, mediaType?: "image" | "video") => Promise<void>;
  handleCreateVideo: (videoPrompt: string) => Promise<void>;

  // Loading handlers
  handleLoadForEdit: (gen: Generation) => void;
  handleLoadForVideo: (gen: Generation) => void;
}

/**
 * Hook for all complex workflow handlers
 * Contains upload logic, database saves, and workflow-specific operations
 */
export function useWorkflowHandlers<TSettings>(
  config: WorkflowHandlersConfig,
  workflowState: WorkflowState<TSettings>,
  setRecentGenerations: (fn: (prev: Generation[]) => Generation[]) => void,
  currentSourceImage: string | null,
  setCurrentSourceImage: (image: string | null) => void,
  renderName: string,
  setRenderName: (name: string) => void,
  setIsGeneratingVideo: (generating: boolean) => void
): UseWorkflowHandlers {

  // Save generation to database
  const saveGenerationToDb = useCallback(async (generation: {
    url: string;
    type: "render" | "video" | "upscale";
    name: string;
    prompt?: string;
    sourceType?: "original" | "from_render" | "from_video";
    parentId?: string;
    settings?: any;
    sourceImage?: string;
  }) => {
    try {
      const userId = getUserIdSync();
      workflowLogger.debug('[SaveGeneration] Attempting to save:', {
        userId,
        type: generation.type,
        name: generation.name,
        hasUrl: !!generation.url,
        hasSourceImage: !!generation.sourceImage
      });

      const response = await fetch(`/api/${config.apiEndpoint}/save-generation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          url: generation.url,
          type: generation.type,
          sourceType: generation.sourceType || "original",
          parentId: generation.parentId,
          prompt: generation.prompt,
          model: generation.type === "video" ? "runway-gen4-turbo" : "nano-banana",
          settings: generation.settings || {},
          name: generation.name,
          sourceImage: generation.sourceImage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        workflowLogger.error('[SaveGeneration] Failed to save:', errorData);
      } else {
        await response.json();
        workflowLogger.info('[SaveGeneration] Successfully saved');
      }
    } catch (error) {
      workflowLogger.error(`[${config.workflowName}] Error saving generation to DB:`, error as Error);
    }
  }, [config.apiEndpoint, config.workflowName]);

  // Handle generation success
  const handleGenerateSuccess = useCallback(async (result: any) => {
    const autoName = config.generateFilename();

    // Upload images to storage
    let storageImageUrl = result.imageUrl;
    let storageSourceUrl = workflowState.inputData.sourceImage.preview;

    try {
      // Upload result image
      const uploadedResult = await uploadBase64Image(
        result.imageUrl,
        `${autoName}-result.jpg`
      );
      if (uploadedResult) {
        storageImageUrl = uploadedResult;
      } else {
        workflowLogger.error('[Upload] Failed to upload result image, using base64');
      }

      // Upload source image
      if (workflowState.inputData.sourceImage.preview) {
        const uploadedSource = await uploadBase64Image(
          workflowState.inputData.sourceImage.preview,
          `${autoName}-source.jpg`
        );
        if (uploadedSource) {
          storageSourceUrl = uploadedSource;
        } else {
          workflowLogger.error('[Upload] Failed to upload source image, using base64');
        }
      }
    } catch (error) {
      workflowLogger.error('[Upload] Error uploading images:', error as Error);
    }

    workflowState.setResultImage(storageImageUrl);
    setRenderName(autoName);
    workflowState.setOriginalPrompt(result.prompt || "");
    setCurrentSourceImage(storageSourceUrl);

    // Add to recent generations
    const newGeneration: Generation = {
      id: result.id || Date.now().toString(),
      imageUrl: storageImageUrl,
      timestamp: result.timestamp || new Date(),
      prompt: result.prompt,
      name: autoName,
      type: "render",
      settings: result.settings,
    };
    setRecentGenerations((prev) => [newGeneration, ...prev]);

    // Save to database
    await saveGenerationToDb({
      url: storageImageUrl,
      type: "render",
      name: autoName,
      prompt: result.prompt,
      sourceType: "original",
      settings: result.settings,
      sourceImage: storageSourceUrl || undefined,
    });

    // Clear prompt and reset settings
    workflowState.setPrompt("");
    workflowState.setSettings(workflowState.settings); // Reset to defaults would be better but we don't have access here
  }, [config, workflowState, saveGenerationToDb, setRecentGenerations, setCurrentSourceImage, setRenderName]);

  // Handle edit success
  const handleEditSuccess = useCallback(async (editedImageUrl: string) => {
    const autoName = config.generateFilename();
    const previousImage = workflowState.resultImage;

    // Upload images to storage
    let storageEditedUrl = editedImageUrl;
    let storagePreviousUrl = previousImage;

    try {
      // Upload edited image
      const uploadedEdited = await uploadBase64Image(
        editedImageUrl,
        `${autoName}-edited.jpg`
      );
      if (uploadedEdited) {
        storageEditedUrl = uploadedEdited;
      }

      // Upload previous image
      if (previousImage) {
        if (previousImage.includes('supabase.co/storage')) {
          storagePreviousUrl = previousImage;
        } else {
          if (previousImage.startsWith('data:')) {
            const uploadedPrevious = await uploadBase64Image(
              previousImage,
              `${autoName}-previous.jpg`
            );
            if (uploadedPrevious) {
              storagePreviousUrl = uploadedPrevious;
            }
          } else {
            const response = await fetch(previousImage);
            const blob = await response.blob();
            const uploadedPrevious = await uploadFile(
              blob,
              `${autoName}-previous.jpg`,
              'image'
            );
            if (uploadedPrevious) {
              storagePreviousUrl = uploadedPrevious;
            }
          }
        }
      }
    } catch (error) {
      workflowLogger.error('[Upload] Error uploading images:', error as Error);
    }

    workflowState.setResultImage(storageEditedUrl);
    setRenderName(autoName);
    setCurrentSourceImage(storagePreviousUrl);

    // Add to recent generations
    const newGeneration: Generation = {
      id: Date.now().toString(),
      imageUrl: storageEditedUrl,
      timestamp: new Date(),
      name: autoName,
      prompt: workflowState.originalPrompt || "",
      type: "render",
      sourceType: "from_render",
      settings: workflowState.settings,
    };

    setRecentGenerations((prev) => [newGeneration, ...prev]);

    // Save to database
    await saveGenerationToDb({
      url: storageEditedUrl,
      type: "render",
      name: autoName,
      prompt: workflowState.originalPrompt || "",
      sourceType: "from_render",
      settings: workflowState.settings,
      sourceImage: storagePreviousUrl || undefined,
    });
  }, [config, workflowState, saveGenerationToDb, setRecentGenerations, setCurrentSourceImage, setRenderName]);

  // Handle upscale success
  const handleUpscaleSuccess = useCallback(async (upscaledImageUrl: string) => {
    workflowLogger.info('[Upscale] Success! Displaying upscaled image in Results View');

    const autoName = config.generateFilename();
    const previousImage = workflowState.resultImage;

    // Upload images to storage
    let storageUpscaledUrl = upscaledImageUrl;
    let storagePreviousUrl = previousImage;

    try {
      // Upload upscaled image (Freepik temporary URL)
      const response = await fetch(upscaledImageUrl);
      const blob = await response.blob();
      const uploadedUpscaled = await uploadFile(
        blob,
        `${autoName}-upscaled.jpg`,
        'image'
      );
      if (uploadedUpscaled) {
        storageUpscaledUrl = uploadedUpscaled;
      }

      // Upload previous image
      if (previousImage) {
        if (previousImage.includes('supabase.co/storage')) {
          storagePreviousUrl = previousImage;
        } else {
          if (previousImage.startsWith('data:')) {
            const uploadedPrevious = await uploadBase64Image(
              previousImage,
              `${autoName}-previous.jpg`
            );
            if (uploadedPrevious) {
              storagePreviousUrl = uploadedPrevious;
            }
          } else {
            const prevResponse = await fetch(previousImage);
            const prevBlob = await prevResponse.blob();
            const uploadedPrevious = await uploadFile(
              prevBlob,
              `${autoName}-previous.jpg`,
              'image'
            );
            if (uploadedPrevious) {
              storagePreviousUrl = uploadedPrevious;
            }
          }
        }
      }
    } catch (error) {
      workflowLogger.error('[Upload] Error uploading images:', error as Error);
    }

    workflowState.setResultImage(storageUpscaledUrl);
    workflowState.setResultMediaType("image");
    setRenderName(autoName);
    setCurrentSourceImage(storagePreviousUrl);

    window.scrollTo({ top: 0, behavior: "smooth" });

    // Add to recent generations
    const newGeneration: Generation = {
      id: Date.now().toString(),
      imageUrl: storageUpscaledUrl,
      timestamp: new Date(),
      name: autoName,
      prompt: "",
      type: "upscale",
      sourceType: "from_render",
      settings: workflowState.settings,
    };

    setRecentGenerations((prev) => [newGeneration, ...prev]);

    // Save to database
    await saveGenerationToDb({
      url: storageUpscaledUrl,
      type: "upscale",
      name: autoName,
      prompt: "",
      sourceType: "from_render",
      settings: workflowState.settings,
      sourceImage: storagePreviousUrl || undefined,
    });
  }, [config, workflowState, saveGenerationToDb, setRecentGenerations, setCurrentSourceImage, setRenderName]);

  // Handle download
  const handleDownload = useCallback(async (imageUrl?: string, filename?: string, mediaType?: "image" | "video") => {
    const urlToDownload = imageUrl || workflowState.resultImage;
    const type = mediaType || workflowState.resultMediaType;

    if (!urlToDownload || typeof urlToDownload !== 'string') {
      workflowLogger.error('[Download] No valid URL to download', new Error(`Invalid URL: ${typeof urlToDownload}`));
      return;
    }

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

  // Handle create video
  const handleCreateVideo = useCallback(async (videoPrompt: string) => {
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

      workflowLogger.debug(`[${config.workflowName}] Starting Runway video generation...`);

      const response = await fetch("/api/generate-runway-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: workflowState.resultImage,
          prompt: videoPrompt,
          cameraMovement,
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

      await saveGenerationToDb({
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
    } catch (error: any) {
      workflowLogger.error(`[${config.workflowName}] Video generation error:`, error);
      alert(`Video-Generierung fehlgeschlagen: ${error.message}`);
    } finally {
      setIsGeneratingVideo(false);
    }
  }, [config, workflowState, saveGenerationToDb, setRecentGenerations, setCurrentSourceImage, setRenderName, setIsGeneratingVideo]);

  // Load generation for editing
  const handleLoadForEdit = useCallback((gen: Generation) => {
    const mediaType = gen.type === "video" ? "video" : "image";
    workflowState.setResultImage(gen.imageUrl);
    workflowState.setResultMediaType(mediaType);
    setRenderName(gen.name || "");
    workflowState.setOriginalPrompt(gen.prompt || "");
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
    saveGenerationToDb,
    handleGenerateSuccess,
    handleEditSuccess,
    handleUpscaleSuccess,
    handleDownload,
    handleCreateVideo,
    handleLoadForEdit,
    handleLoadForVideo,
  };
}
