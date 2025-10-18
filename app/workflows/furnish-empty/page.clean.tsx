/**
 * Furnish-Empty Workflow Page
 *
 * Uses the generic WorkflowPage component with workflow-specific configuration.
 * This eliminates ~97% code duplication between workflows.
 */

'use client';

import { WorkflowPage, type WorkflowPageConfig } from '@/components/workflows/WorkflowPage';
import { FurnishEmptyPromptInput } from '@/components/workflows/furnish-empty';
import { DEFAULT_FURNISH_EMPTY_SETTINGS, type FurnishEmptySettingsType } from '@/types/workflows/furnishEmptySettings';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { FurnishEmptyProvider } from '@/contexts/FurnishEmptyContext';
import { useFurnishEmptyAdapterWithContext } from '@/hooks/workflows/furnish-empty/useFurnishEmptyAdapterWithContext';
import { useFurnishEmptyPromptEnhancerAdapter } from '@/hooks/workflows/furnish-empty/useFurnishEmptyPromptEnhancerAdapter';
import {
  useRenderEditAdapter,
  useUpscaleAdapter
} from '@/hooks/workflows';

/**
 * Furnish-Empty Workflow Configuration
 * Only workflow-specific settings and components are defined here
 */
const furnishEmptyConfig: WorkflowPageConfig<FurnishEmptySettingsType> = {
  name: 'Furnish Empty',
  apiEndpoint: 'furnish-empty',
  defaultSettings: DEFAULT_FURNISH_EMPTY_SETTINGS,

  // Workflow-specific components
  PromptInputComponent: FurnishEmptyPromptInput,

  // Workflow-specific hooks (using adapters for standardization)
  hooks: {
    useGenerate: useFurnishEmptyAdapterWithContext,
    useEnhance: (sourceImage, settings) =>
      useFurnishEmptyPromptEnhancerAdapter(sourceImage, settings as FurnishEmptySettingsType),
    useEdit: useRenderEditAdapter,
    useUpscale: useUpscaleAdapter,
  },

  // Generate unique filename
  generateFilename: () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, ""); // HHMMSS
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0"); // 4-digit random
    return `payperwork-furnishempty-${dateStr}-${timeStr}-${random}`;
  },
};

/**
 * Furnish-Empty Page Component
 *
 * This is ALL the code needed for the entire workflow page!
 * Everything else is handled by the generic WorkflowPage component.
 */
export default function FurnishEmptyPage() {
  return (
    <ErrorBoundary>
      <FurnishEmptyProvider>
        <WorkflowPage config={furnishEmptyConfig} />
      </FurnishEmptyProvider>
    </ErrorBoundary>
  );
}
