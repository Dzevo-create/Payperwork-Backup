'use client';

import type { WorkflowState } from './useWorkflowState';
import type { Generation } from './useRecentGenerations';
import { useDatabaseSave } from './useDatabaseSave';
import { useFileUpload } from './useFileUpload';
import { useGenerationSuccess } from './useGenerationSuccess';
import { useDownload } from './useDownload';
import { useVideoCreation } from './useVideoCreation';
import { useGenerationLoader } from './useGenerationLoader';

export interface WorkflowHandlersConfig {
  apiEndpoint: string;
  workflowName: string;
  generateFilename: () => string;
}

export interface GenerationResult {
  imageUrl: string;
  id?: string;
  timestamp?: Date;
  prompt?: string;
  settings?: Record<string, unknown>;
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
    settings?: Record<string, unknown>;
    sourceImage?: string;
  }) => Promise<void>;

  // Success handlers
  handleGenerateSuccess: (result: GenerationResult) => Promise<void>;
  handleEditSuccess: (editedImageUrl: string) => Promise<void>;
  handleUpscaleSuccess: (upscaledImageUrl: string) => Promise<void>;

  // Action handlers
  handleDownload: (imageUrl?: string, filename?: string, mediaType?: "image" | "video") => Promise<void>;
  handleCreateVideo: (videoPrompt: string, duration?: 5 | 10) => Promise<void>;

  // Loading handlers
  handleLoadForEdit: (gen: Generation) => void;
  handleLoadForVideo: (gen: Generation) => void;
}

/**
 * Orchestrating hook that composes all workflow handler sub-hooks
 * Provides a unified interface for all workflow operations including:
 * - Database persistence
 * - File uploads
 * - Generation success handling
 * - Downloads
 * - Video creation
 * - Generation loading
 */
export function useWorkflowHandlers<TSettings extends Record<string, unknown>>(
  config: WorkflowHandlersConfig,
  workflowState: WorkflowState<TSettings>,
  setRecentGenerations: (fn: (prev: Generation[]) => Generation[]) => void,
  _currentSourceImage: string | null,
  setCurrentSourceImage: (image: string | null) => void,
  renderName: string,
  setRenderName: (name: string) => void,
  setIsGeneratingVideo: (generating: boolean) => void,
  defaultSettings: TSettings
): UseWorkflowHandlers {

  // Initialize all sub-hooks
  const databaseSave = useDatabaseSave({
    apiEndpoint: config.apiEndpoint,
    workflowName: config.workflowName,
  });

  const fileUpload = useFileUpload();

  const generationSuccess = useGenerationSuccess(
    { generateFilename: config.generateFilename },
    workflowState,
    setRecentGenerations,
    setCurrentSourceImage,
    setRenderName,
    defaultSettings,
    fileUpload,
    databaseSave
  );

  const download = useDownload(workflowState, renderName);

  const videoCreation = useVideoCreation(
    {
      workflowName: config.workflowName,
      generateFilename: config.generateFilename,
    },
    workflowState,
    setRecentGenerations,
    setCurrentSourceImage,
    setRenderName,
    setIsGeneratingVideo,
    databaseSave
  );

  const generationLoader = useGenerationLoader(workflowState, setRenderName);

  // Return composed interface
  return {
    saveGenerationToDb: databaseSave.saveGenerationToDb,
    handleGenerateSuccess: generationSuccess.handleGenerateSuccess,
    handleEditSuccess: generationSuccess.handleEditSuccess,
    handleUpscaleSuccess: generationSuccess.handleUpscaleSuccess,
    handleDownload: download.handleDownload,
    handleCreateVideo: videoCreation.handleCreateVideo,
    handleLoadForEdit: generationLoader.handleLoadForEdit,
    handleLoadForVideo: generationLoader.handleLoadForVideo,
  };
}
