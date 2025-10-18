/**
 * Branding Workflow Page
 *
 * Uses the generic WorkflowPage component with workflow-specific configuration.
 * This eliminates ~97% code duplication between workflows.
 */

'use client';

import { WorkflowPage, type WorkflowPageConfig } from '@/components/workflows/WorkflowPage';
import { BrandingPromptInput } from '@/components/workflows/BrandingPromptInput';
import { DEFAULT_BRANDING_SETTINGS, type BrandingSettingsType } from '@/types/workflows/brandingSettings';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import {
  useBrandingAdapter,
  usePromptEnhancerAdapter,
  useRenderEditAdapter,
  useUpscaleAdapter
} from '@/hooks/workflows';

/**
 * Branding Workflow Configuration
 * Only workflow-specific settings and components are defined here
 */
const brandingConfig: WorkflowPageConfig<BrandingSettingsType> = {
  name: 'Branding',
  apiEndpoint: 'branding',
  defaultSettings: DEFAULT_BRANDING_SETTINGS,

  // Workflow-specific components
  PromptInputComponent: BrandingPromptInput,

  // Workflow-specific hooks (using adapters for standardization)
  hooks: {
    useGenerate: useBrandingAdapter,
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
    return `payperwork-branding-${dateStr}-${timeStr}-${random}`;
  },
};

/**
 * Branding Page Component
 *
 * This is ALL the code needed for the entire workflow page!
 * Everything else is handled by the generic WorkflowPage component.
 */
export default function BrandingPage() {
  return (
    <ErrorBoundary>
      <WorkflowPage config={brandingConfig} />
    </ErrorBoundary>
  );
}
