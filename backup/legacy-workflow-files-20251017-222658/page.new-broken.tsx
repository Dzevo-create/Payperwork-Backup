/**
 * Branding Workflow Page (NEW - Using Generic WorkflowPage)
 *
 * This is the refactored version using the generic WorkflowPage component.
 * Original file: page.tsx (1111 lines)
 * New file: page.new.tsx (only ~50 lines!)
 *
 * To activate: Rename page.tsx to page.old.tsx and rename this file to page.tsx
 */

"use client";

import { useMemo } from "react";
import { WorkflowPage, type WorkflowPageConfig } from "@/components/workflows/WorkflowPage";
import { RenderPromptInput } from "@/components/workflows/RenderPromptInput";
import { RenderSettingsType, DEFAULT_RENDER_SETTINGS } from "@/types/workflows/renderSettings";
import {
  useBrandingAdapter,
  useRenderEditAdapter,
  useUpscaleAdapter,
} from "@/hooks/workflows/useWorkflowAdapter";

/**
 * Branding Page Component
 *
 * From 1111 lines → 50 lines = 95% reduction! 🎉
 */
export default function BrandingPage() {
  const brandingConfig: WorkflowPageConfig<RenderSettingsType> = useMemo(() => ({
    name: "Branding",
    apiEndpoint: "branding",
    defaultSettings: DEFAULT_RENDER_SETTINGS,

    // Components
    PromptInputComponent: RenderPromptInput as any,

    // Hooks - using adapters for standardized interface
    hooks: {
      useGenerate: useBrandingAdapter,
      useEdit: useRenderEditAdapter,
      useUpscale: useUpscaleAdapter,
    },

    // Generate unique filename
    generateFilename: () => {
      const now = new Date();
      const dateStr = (now.toISOString().split('T')[0] || '').replace(/-/g, '');
      const timeStr = (now.toTimeString().split(' ')[0] || '').replace(/:/g, '');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
      return `payperwork-branding-${dateStr}-${timeStr}-${random}`;
    },
  }), []);

  return <WorkflowPage config={brandingConfig} />;
}

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';
