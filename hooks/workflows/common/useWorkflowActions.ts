/**
 * useWorkflowActions Hook
 *
 * All action handlers for WorkflowPage component.
 * Handles Generate, Edit, Upscale, Crop, Lightbox navigation, etc.
 *
 * Responsibilities:
 * - Workflow actions (enhance, generate, edit, upscale)
 * - Lightbox actions (open, navigate)
 * - Crop actions (source, reference, result, complete)
 */

'use client';

import { useCallback } from 'react';
import { workflowLogger } from '@/lib/logger';
import type { WorkflowPageState } from './useWorkflowPageState';

/**
 * All workflow action handlers
 */
export interface WorkflowActions {
  // Workflow Actions
  handleEnhancePrompt: () => Promise<void>;
  handleGenerate: () => Promise<void>;
  handleEdit: (editPrompt: string, referenceImages?: string[]) => Promise<void>;
  handleUpscale: (gen?: { imageUrl: string }) => Promise<void>;

  // Lightbox Actions
  handleResultClick: () => void;
  handleNavigateLightbox: (direction: "prev" | "next") => void;

  // Crop Actions
  handleCropSource: () => void;
  handleCropReference: (index: number) => void;
  handleCropResult: () => void;
  handleCropComplete: (croppedImageUrl: string) => Promise<void>;
}

/**
 * Custom hook for WorkflowPage actions
 *
 * @param state - Complete workflow page state
 * @returns All action handlers
 */
export function useWorkflowActions<TSettings extends Record<string, unknown>>(
  state: WorkflowPageState<TSettings>
): WorkflowActions {

  // Enhance Prompt
  const handleEnhancePrompt = useCallback(async () => {
    if (!state.enhanceHook) return;
    const enhanced = await state.enhanceHook.enhance(state.workflowState.prompt);
    if (enhanced) {
      state.workflowState.setPrompt(enhanced);
    }
  }, [state.enhanceHook, state.workflowState]);

  // Generate
  const handleGenerate = useCallback(async () => {
    if (!state.workflowState.inputData.sourceImage.file) {
      alert("Bitte lade zuerst ein Ausgangsbild hoch");
      return;
    }

    const result = await state.generate({
      prompt: state.workflowState.prompt,
      settings: state.workflowState.settings,
      sourceImage: state.workflowState.inputData.sourceImage.preview,
      referenceImages: state.workflowState.inputData.referenceImages
        .map(img => img.preview)
        .filter(Boolean) as (string | null)[],
    });

    if (result) {
      await state.handlers.handleGenerateSuccess(result);
    }
  }, [state]);

  // Edit
  const handleEdit = useCallback(async (editPrompt: string, referenceImages?: string[]) => {
    if (!state.workflowState.resultImage || !editPrompt.trim() || !state.editHook) return;

    const result = await state.editHook.edit({
      editPrompt,
      currentImageUrl: state.workflowState.resultImage,
      originalPrompt: state.workflowState.originalPrompt,
      referenceImages,
    });

    if (result) {
      await state.handlers.handleEditSuccess(result.imageUrl);
    }
  }, [state]);

  // Upscale
  const handleUpscale = useCallback(async (gen?: { imageUrl: string }) => {
    const imageToUpscale = gen?.imageUrl || state.workflowState.resultImage;
    if (!imageToUpscale || !state.upscaleHook) {
      workflowLogger.error('[Upscale] No image to upscale');
      return;
    }

    const result = await state.upscaleHook.upscale({ imageUrl: imageToUpscale });
    if (result) {
      await state.handlers.handleUpscaleSuccess(result);
    }
  }, [state]);

  // Lightbox: Result Click
  const handleResultClick = useCallback(() => {
    if (state.workflowState.resultImage) {
      const index = state.generations.recentGenerations.findIndex(
        (gen) => gen.imageUrl === state.workflowState.resultImage
      );

      if (index !== -1) {
        const gen = state.generations.recentGenerations[index];
        if (gen) {
          state.lightbox.openLightbox({
            id: gen.id,
            imageUrl: gen.imageUrl,
            timestamp: gen.timestamp,
            name: gen.name,
            prompt: gen.prompt,
            sourceImageUrl: gen.sourceImageUrl, // Add source image
            type: gen.type === "image" ? "render" : gen.type as "render" | "video" | "upscale"
          }, index);
        }
      } else {
        state.lightbox.openLightbox(
          {
            id: "current",
            imageUrl: state.workflowState.resultImage,
            timestamp: new Date(),
            name: state.renderName,
            sourceImageUrl: state.currentSourceImage || undefined, // Add current source image
            type: "render"
          },
          -1
        );
      }
    }
  }, [state]);

  // Lightbox: Navigate
  const handleNavigateLightbox = useCallback((direction: "prev" | "next") => {
    const newIndex = direction === "prev"
      ? state.lightbox.lightboxIndex - 1
      : state.lightbox.lightboxIndex + 1;

    if (newIndex >= 0 && newIndex < state.generations.recentGenerations.length) {
      const gen = state.generations.recentGenerations[newIndex];
      if (gen) {
        state.lightbox.setLightboxIndex(newIndex);
        state.lightbox.openLightbox({
          id: gen.id,
          imageUrl: gen.imageUrl,
          timestamp: gen.timestamp,
          name: gen.name,
          prompt: gen.prompt,
          sourceImageUrl: gen.sourceImageUrl, // Add source image
          type: gen.type === "image" ? "render" : gen.type as "render" | "video" | "upscale"
        }, newIndex);
      }
    }
  }, [state]);

  // Crop: Source
  const handleCropSource = useCallback(() => {
    const imageToUse = state.workflowState.inputData.sourceImage.originalPreview
      || state.workflowState.inputData.sourceImage.preview;
    if (imageToUse) {
      state.crop.openCropModal(imageToUse, 'source');
    }
  }, [state]);

  // Crop: Reference
  const handleCropReference = useCallback((index: number) => {
    const refImage = state.workflowState.inputData.referenceImages[index];
    const imageToUse = refImage?.originalPreview || refImage?.preview;
    if (imageToUse) {
      state.crop.openCropModal(imageToUse, 'reference', index);
    }
  }, [state]);

  // Crop: Result
  const handleCropResult = useCallback(() => {
    if (state.workflowState.resultImage) {
      state.crop.openCropModal(state.workflowState.resultImage, 'source');
    }
  }, [state]);

  // Crop: Complete
  const handleCropComplete = useCallback(async (croppedImageUrl: string) => {
    const response = await fetch(croppedImageUrl);
    const blob = await response.blob();
    const file = new File([blob], "cropped-image.jpg", { type: "image/jpeg" });

    if (state.crop.cropImageType === 'source') {
      state.workflowState.setInputData((prev) => ({
        ...prev,
        sourceImage: {
          file,
          preview: croppedImageUrl,
          originalPreview: prev.sourceImage.originalPreview || prev.sourceImage.preview
        },
      }));
    } else if (state.crop.cropImageType === 'reference' && state.crop.cropReferenceIndex !== null) {
      state.workflowState.setInputData((prev) => {
        const newReferenceImages = [...prev.referenceImages];
        const currentRef = newReferenceImages[state.crop.cropReferenceIndex!];
        newReferenceImages[state.crop.cropReferenceIndex!] = {
          file,
          preview: croppedImageUrl,
          originalPreview: currentRef?.originalPreview || currentRef?.preview || null
        };
        return {
          ...prev,
          referenceImages: newReferenceImages,
        };
      });
    } else if (state.crop.cropImageType === null) {
      // Cropping the result image - replace result image
      state.workflowState.setResultImage(croppedImageUrl);
    }

    state.crop.closeCropModal();
  }, [state]);

  return {
    handleEnhancePrompt,
    handleGenerate,
    handleEdit,
    handleUpscale,
    handleResultClick,
    handleNavigateLightbox,
    handleCropSource,
    handleCropReference,
    handleCropResult,
    handleCropComplete,
  };
}
