'use client';

import { useCallback } from 'react';
import { workflowLogger } from '@/lib/logger';
import type { WorkflowState } from './useWorkflowState';
import type { Generation } from './useRecentGenerations';
import type { UseFileUpload } from './useFileUpload';
import type { UseDatabaseSave } from './useDatabaseSave';

export interface GenerationSuccessConfig {
  generateFilename: () => string;
}

export interface GenerationResult {
  imageUrl: string;
  id?: string;
  timestamp?: Date;
  prompt?: string;
  settings?: Record<string, unknown>;
}

export interface UseGenerationSuccess {
  handleGenerateSuccess: (result: GenerationResult) => Promise<void>;
  handleEditSuccess: (editedImageUrl: string) => Promise<void>;
  handleUpscaleSuccess: (upscaledImageUrl: string) => Promise<void>;
}

/**
 * Hook for handling successful workflow generations
 * Manages state updates, uploads, and database saves for generate, edit, and upscale operations
 */
export function useGenerationSuccess<TSettings extends Record<string, unknown>>(
  config: GenerationSuccessConfig,
  workflowState: WorkflowState<TSettings>,
  setRecentGenerations: (fn: (prev: Generation[]) => Generation[]) => void,
  setCurrentSourceImage: (image: string | null) => void,
  setRenderName: (name: string) => void,
  defaultSettings: TSettings,
  fileUpload: UseFileUpload,
  databaseSave: UseDatabaseSave
): UseGenerationSuccess {

  // Handle generation success
  const handleGenerateSuccess = useCallback(async (result: GenerationResult) => {
    const autoName = config.generateFilename();

    // Upload images to storage
    let storageImageUrl = result.imageUrl;
    let storageSourceUrl = workflowState.inputData.sourceImage.preview;

    try {
      // Upload result image
      storageImageUrl = await fileUpload.uploadResultImage(
        result.imageUrl,
        `${autoName}-result.jpg`
      );

      // Upload source image
      if (workflowState.inputData.sourceImage.preview) {
        storageSourceUrl = await fileUpload.uploadSourceImage(
          workflowState.inputData.sourceImage.preview,
          `${autoName}-source.jpg`
        );
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
    await databaseSave.saveGenerationToDb({
      url: storageImageUrl,
      type: "render",
      name: autoName,
      prompt: result.prompt,
      sourceType: "original",
      settings: result.settings,
      sourceImage: storageSourceUrl || undefined,
    });

    // Clear prompt and reset settings to default
    workflowLogger.info('[GenerateSuccess] Resetting prompt and settings', {
      currentSettings: workflowState.settings,
      defaultSettings,
    });
    workflowState.setPrompt("");
    workflowState.setSettings(defaultSettings);

    // Log after a short delay to verify the state update
    setTimeout(() => {
      workflowLogger.info('[GenerateSuccess] Settings after reset', {
        settings: workflowState.settings,
      });
    }, 100);
  }, [config, workflowState, setRecentGenerations, setCurrentSourceImage, setRenderName, defaultSettings, fileUpload, databaseSave]);

  // Handle edit success
  const handleEditSuccess = useCallback(async (editedImageUrl: string) => {
    const autoName = config.generateFilename();
    const previousImage = workflowState.resultImage;

    // Upload images to storage
    let storageEditedUrl = editedImageUrl;
    let storagePreviousUrl = previousImage;

    try {
      // Upload edited image
      storageEditedUrl = await fileUpload.uploadResultImage(
        editedImageUrl,
        `${autoName}-edited.jpg`
      );

      // Upload previous image
      if (previousImage) {
        storagePreviousUrl = await fileUpload.uploadPreviousImage(
          previousImage,
          `${autoName}-previous.jpg`
        );
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
    await databaseSave.saveGenerationToDb({
      url: storageEditedUrl,
      type: "render",
      name: autoName,
      prompt: workflowState.originalPrompt || "",
      sourceType: "from_render",
      settings: workflowState.settings,
      sourceImage: storagePreviousUrl || undefined,
    });
  }, [config, workflowState, setRecentGenerations, setCurrentSourceImage, setRenderName, fileUpload, databaseSave]);

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
      storageUpscaledUrl = await fileUpload.uploadImageFromUrl(
        upscaledImageUrl,
        `${autoName}-upscaled.jpg`
      );

      // Upload previous image
      if (previousImage) {
        storagePreviousUrl = await fileUpload.uploadPreviousImage(
          previousImage,
          `${autoName}-previous.jpg`
        );
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
    await databaseSave.saveGenerationToDb({
      url: storageUpscaledUrl,
      type: "upscale",
      name: autoName,
      prompt: "",
      sourceType: "from_render",
      settings: workflowState.settings,
      sourceImage: storagePreviousUrl || undefined,
    });
  }, [config, workflowState, setRecentGenerations, setCurrentSourceImage, setRenderName, fileUpload, databaseSave]);

  return {
    handleGenerateSuccess,
    handleEditSuccess,
    handleUpscaleSuccess,
  };
}
