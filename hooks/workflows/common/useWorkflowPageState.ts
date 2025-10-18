/**
 * useWorkflowPageState Hook
 *
 * Centralized state management for WorkflowPage component.
 * Manages all UI state, workflow state, and initializes workflow hooks.
 *
 * Responsibilities:
 * - UI state (sidebar, collapse, etc.)
 * - Workflow state (render name, source image, video generation)
 * - Initialize all workflow hooks
 * - Initialize config hooks (generate, enhance, edit, upscale)
 */

'use client';

import { useState } from 'react';
import {
  useWorkflowState,
  useRecentGenerations,
  useWorkflowLightbox,
  useImageCrop,
  useWorkflowHandlers
} from '@/hooks/workflows';
import type { WorkflowPageConfig } from '@/components/workflows/WorkflowPage';

/**
 * Complete state interface for WorkflowPage
 */
export interface WorkflowPageState<TSettings extends Record<string, unknown>> {
  // UI State
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;

  // Workflow State
  renderName: string;
  setRenderName: (name: string) => void;
  currentSourceImage: string | null;
  setCurrentSourceImage: (image: string | null) => void;
  isGeneratingVideo: boolean;
  setIsGeneratingVideo: (generating: boolean) => void;

  // Workflow Hooks
  workflowState: ReturnType<typeof useWorkflowState<TSettings>>;
  generations: ReturnType<typeof useRecentGenerations>;
  lightbox: ReturnType<typeof useWorkflowLightbox>;
  crop: ReturnType<typeof useImageCrop>;
  handlers: ReturnType<typeof useWorkflowHandlers<TSettings>>;

  // Config Hooks
  generate: (params: { prompt: string; settings: TSettings; sourceImage: string | null; referenceImages: (string | null)[] }) => Promise<{ imageUrl: string; id?: string; timestamp?: Date; prompt?: string; settings?: Record<string, unknown> } | null>;
  isGenerating: boolean;
  enhanceHook?: ReturnType<NonNullable<WorkflowPageConfig<TSettings>['hooks']['useEnhance']>>;
  editHook?: ReturnType<NonNullable<WorkflowPageConfig<TSettings>['hooks']['useEdit']>>;
  upscaleHook?: ReturnType<NonNullable<WorkflowPageConfig<TSettings>['hooks']['useUpscale']>>;
}

/**
 * Custom hook for WorkflowPage state management
 *
 * @param config - Workflow configuration object
 * @returns Complete state object with all hooks and state setters
 */
export function useWorkflowPageState<TSettings extends Record<string, unknown>>(
  config: WorkflowPageConfig<TSettings>
): WorkflowPageState<TSettings> {

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [renderName, setRenderName] = useState("");
  const [currentSourceImage, setCurrentSourceImage] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // Workflow Hooks
  const workflowState = useWorkflowState<TSettings>(config.defaultSettings);
  const generations = useRecentGenerations(config.apiEndpoint as 'sketch-to-render' | 'branding');
  const lightbox = useWorkflowLightbox();
  const crop = useImageCrop();

  // Config Hooks
  const { generate, isGenerating } = config.hooks.useGenerate();
  const enhanceHook = config.hooks.useEnhance?.(
    workflowState.inputData.sourceImage.preview,
    workflowState.settings
  );
  const editHook = config.hooks.useEdit?.();
  const upscaleHook = config.hooks.useUpscale?.();

  // Handlers Hook
  const handlers = useWorkflowHandlers(
    {
      apiEndpoint: config.apiEndpoint,
      workflowName: config.name,
      generateFilename: config.generateFilename,
    },
    workflowState,
    generations.setRecentGenerations,
    currentSourceImage,
    setCurrentSourceImage,
    renderName,
    setRenderName,
    setIsGeneratingVideo,
    config.defaultSettings
  );

  return {
    // UI State
    isSidebarOpen,
    setIsSidebarOpen,
    isCollapsed,
    setIsCollapsed,

    // Workflow State
    renderName,
    setRenderName,
    currentSourceImage,
    setCurrentSourceImage,
    isGeneratingVideo,
    setIsGeneratingVideo,

    // Workflow Hooks
    workflowState,
    generations,
    lightbox,
    crop,
    handlers,

    // Config Hooks
    generate,
    isGenerating,
    enhanceHook,
    editHook,
    upscaleHook,
  };
}
