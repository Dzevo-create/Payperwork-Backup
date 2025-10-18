/**
 * Generic Workflow Page Component
 *
 * This component provides a reusable structure for all workflow pages
 * (sketch-to-render, branding, etc.) by accepting a configuration object
 * that defines workflow-specific behavior.
 *
 * Benefits:
 * - Eliminates ~97% code duplication between workflow pages
 * - Single source of truth for workflow UI structure
 * - Easier to maintain and add new features
 * - Type-safe with TypeScript
 *
 * REFACTORED: This component now orchestrates specialized sub-components and hooks
 * for better separation of concerns and maintainability.
 */

"use client";

import { ReactNode } from "react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

// Refactored hooks
import { useWorkflowPageState } from "@/hooks/workflows/common/useWorkflowPageState";
import { useWorkflowActions } from "@/hooks/workflows/common/useWorkflowActions";
import { useChatIntegration } from "@/hooks/workflows/common/useChatIntegration";

// Refactored components
import { WorkflowPageLayout } from "./WorkflowPageLayout";
import { WorkflowModals } from "./WorkflowModals";

/**
 * Workflow generation result interface
 */
export interface WorkflowGenerationResult {
  imageUrl: string;
  id?: string;
  timestamp?: Date;
  prompt?: string;
  settings?: Record<string, unknown>;
}

/**
 * Workflow Configuration Interface
 */
export interface WorkflowPageConfig<TSettings extends Record<string, unknown> = Record<string, unknown>> {
  /** Workflow name (e.g. "Sketch to Render") */
  name: string;

  /** API endpoint prefix (e.g. "sketch-to-render") */
  apiEndpoint: string;

  /** Default settings for this workflow */
  defaultSettings: TSettings;

  /** Prompt input component */
  PromptInputComponent: React.ComponentType<{
    prompt: string;
    onPromptChange: (value: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    onEnhancePrompt?: () => void;
    isEnhancing?: boolean;
    disabled?: boolean;
    settings: TSettings;
    onSettingsChange: (settings: TSettings) => void;
  }>;

  /** Hooks */
  hooks: {
    useGenerate: () => {
      generate: (params: {
        prompt: string;
        settings: TSettings;
        sourceImage: string | null;
        referenceImages: (string | null)[];
      }) => Promise<WorkflowGenerationResult | null>;
      isGenerating: boolean;
      error: string | null;
      progress: number;
    };
    useEnhance?: (sourceImage: string | null, settings: TSettings) => {
      enhance: (prompt: string) => Promise<string>;
      isEnhancing: boolean;
      error: string | null;
    };
    useEdit?: () => {
      edit: (params: {
        editPrompt: string;
        currentImageUrl: string;
        originalPrompt: string;
        referenceImages?: string[];
      }) => Promise<WorkflowGenerationResult | null>;
      isEditing: boolean;
      error: string | null;
    };
    useUpscale?: () => {
      upscale: (params: { imageUrl: string }) => Promise<string | null>;
      isUpscaling: boolean;
      error: string | null;
    };
  };

  /** Generate filename for this workflow */
  generateFilename: () => string;

  /** Additional workflow-specific content (optional) */
  renderAdditionalContent?: (context: {
    resultImage: string | null;
    resultMediaType: "image" | "video";
    renderName: string;
    originalPrompt: string;
    settings: TSettings;
  }) => ReactNode;
}

interface WorkflowPageProps<TSettings extends Record<string, unknown> = Record<string, unknown>> {
  config: WorkflowPageConfig<TSettings>;
}

/**
 * Main WorkflowPage Component - Orchestrates all sub-components
 *
 * This refactored version delegates responsibilities to specialized hooks and components:
 * - useWorkflowPageState: State management
 * - useWorkflowActions: Action handlers
 * - useChatIntegration: Chat store integration
 * - WorkflowPageLayout: UI layout and structure
 * - WorkflowModals: Modal overlays (lightbox, crop)
 */
export function WorkflowPage<TSettings extends Record<string, unknown> = Record<string, unknown>>({
  config
}: WorkflowPageProps<TSettings>) {

  // State Management Hook
  const state = useWorkflowPageState(config);

  // Actions Hook
  const actions = useWorkflowActions(state);

  // Chat Integration Hook
  const chat = useChatIntegration();

  return (
    <ErrorBoundary>
      {/* Main Layout */}
      <WorkflowPageLayout
        config={config}
        state={state}
        actions={actions}
        chat={chat}
      />

      {/* Modal Overlays */}
      <WorkflowModals
        state={state}
        actions={actions}
      />
    </ErrorBoundary>
  );
}
