/**
 * Sketch-to-Render Workflow Page
 *
 * Uses the generic WorkflowPage component with workflow-specific configuration.
 * This eliminates ~97% code duplication between workflows.
 */

'use client';

import { WorkflowPage, type WorkflowPageConfig } from '@/components/workflows/WorkflowPage';
import { RenderPromptInput } from '@/components/workflows/RenderPromptInput';
import { DEFAULT_RENDER_SETTINGS, type RenderSettingsType } from '@/types/workflows/renderSettings';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import {
  useSketchToRenderAdapter,
  usePromptEnhancerAdapter,
  useRenderEditAdapter,
  useUpscaleAdapter
} from '@/hooks/workflows';

/**
 * Sketch-to-Render Workflow Configuration
 * Only workflow-specific settings and components are defined here
 */
const sketchToRenderConfig: WorkflowPageConfig<RenderSettingsType> = {
  name: 'Sketch to Render',
  apiEndpoint: 'sketch-to-render',
  defaultSettings: DEFAULT_RENDER_SETTINGS,

  // Workflow-specific components
  PromptInputComponent: RenderPromptInput,

  // Workflow-specific hooks (using adapters for standardization)
  hooks: {
    useGenerate: useSketchToRenderAdapter,
    useEnhance: (sourceImage, settings) =>
      usePromptEnhancerAdapter(sourceImage, settings),
    useEdit: useRenderEditAdapter,
    useUpscale: useUpscaleAdapter,
  },

  // Generate unique filename
  generateFilename: () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ""); // HHMMSS
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0"); // 4-digit random
    return `payperwork-sketchtorender-${dateStr}-${timeStr}-${random}`;
  },
};

/**
 * Sketch-to-Render Page Component
 *
 * This is ALL the code needed for the entire workflow page!
 * Everything else is handled by the generic WorkflowPage component.
 */
export default function SketchToRenderPage() {
  return (
    <ErrorBoundary>
      <WorkflowPage config={sketchToRenderConfig} />
    </ErrorBoundary>
  );
}
