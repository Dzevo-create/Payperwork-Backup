// app/workflows/render-to-cad/page.clean.tsx
'use client';

import { WorkflowPage, type WorkflowPageConfig } from '@/components/workflows/WorkflowPage';
import { RenderToCadPromptInput } from '@/components/workflows/render-to-cad';
import { DEFAULT_RENDER_TO_CAD_SETTINGS, type RenderToCadSettingsType } from '@/types/workflows/renderToCadSettings';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import {
  useRenderToCadAdapter,
  useRenderToCadEnhancerAdapter,
  useRenderEditAdapter,
  useUpscaleAdapter,
} from '@/hooks/workflows';

const renderToCadConfig: WorkflowPageConfig<RenderToCadSettingsType> = {
  name: 'Render-to-CAD',
  apiEndpoint: 'render-to-cad',
  defaultSettings: DEFAULT_RENDER_TO_CAD_SETTINGS,

  PromptInputComponent: RenderToCadPromptInput,

  hooks: {
    useGenerate: useRenderToCadAdapter,
    useEnhance: (sourceImage, settings) =>
      useRenderToCadEnhancerAdapter(sourceImage, settings),
    useEdit: useRenderEditAdapter,
    useUpscale: useUpscaleAdapter,
  },

  generateFilename: () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `payperwork-rendertocad-${dateStr}-${timeStr}-${random}`;
  },
};

export default function RenderToCadPage() {
  return (
    <ErrorBoundary>
      <WorkflowPage config={renderToCadConfig} />
    </ErrorBoundary>
  );
}
