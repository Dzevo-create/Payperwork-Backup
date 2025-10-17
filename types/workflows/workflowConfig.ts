/**
 * Workflow Configuration Type
 *
 * Defines the structure for configuring generic workflow pages.
 * This allows for code reuse across different workflows while maintaining
 * workflow-specific components and logic.
 */

import { ComponentType } from 'react';

/**
 * Workflow Hook Interface
 * Defines the contract that all workflow hooks must implement
 */
export interface WorkflowHookReturn {
  generate: (params: any) => Promise<void>;
  isGenerating: boolean;
  error: string | null;
  progress: number;
}

/**
 * Workflow Configuration
 * @template TSettings - Type of settings specific to this workflow
 */
export interface WorkflowConfig<TSettings = any> {
  /**
   * Display name of the workflow
   * @example "Sketch-to-Render" or "Branding"
   */
  name: string;

  /**
   * API endpoint for fetching recent generations
   * @example "/api/sketch-to-render" or "/api/branding"
   */
  apiEndpoint: string;

  /**
   * Component for the prompt input area
   * Must accept: value, onChange, onGenerate, isGenerating props
   */
  PromptInputComponent: ComponentType<{
    value: string;
    onChange: (value: string) => void;
    onGenerate: () => void;
    isGenerating: boolean;
  }>;

  /**
   * Optional component for workflow-specific settings
   * Must accept: value, onChange props
   */
  SettingsComponent?: ComponentType<{
    value: TSettings;
    onChange: (value: TSettings) => void;
  }>;

  /**
   * Default settings for this workflow
   */
  defaultSettings: TSettings;

  /**
   * Workflow-specific hook
   * Must return: generate, isGenerating, error, progress
   */
  useWorkflowHook: () => WorkflowHookReturn;
}

/**
 * Input Data Structure
 * Used by all workflows for managing source and reference images
 */
export interface WorkflowInputData {
  sourceImage: {
    file: File | null;
    preview: string | null;
    originalPreview: string | null;
  };
  referenceImages: Array<{
    file: File;
    preview: string;
  }>;
}

/**
 * Generation Parameters
 * Standard parameters passed to the generate function
 */
export interface WorkflowGenerateParams<TSettings = any> {
  prompt: string;
  settings: TSettings;
  sourceImage: string | null;
  referenceImages: string[];
}
