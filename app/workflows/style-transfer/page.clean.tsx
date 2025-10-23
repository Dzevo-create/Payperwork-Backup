"use client";

import { WorkflowPage, type WorkflowPageConfig } from "@/components/workflows/WorkflowPage";
import { StyleTransferPromptInput } from "@/components/workflows/style-transfer";
import {
  DEFAULT_STYLE_TRANSFER_SETTINGS,
  type StyleTransferSettingsType,
} from "@/types/workflows/styleTransferSettings";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { StyleTransferProvider } from "@/contexts/StyleTransferContext";
import { useStyleTransferAdapterWithContext } from "@/hooks/workflows/style-transfer/useStyleTransferAdapterWithContext";
import { useStyleTransferPromptEnhancerAdapter } from "@/hooks/workflows/style-transfer/useStyleTransferPromptEnhancerAdapter";
import { useRenderEditAdapter, useUpscaleAdapter } from "@/hooks/workflows";

const styleTransferConfig: WorkflowPageConfig<StyleTransferSettingsType> = {
  name: "Style Transfer",
  apiEndpoint: "style-transfer",
  defaultSettings: DEFAULT_STYLE_TRANSFER_SETTINGS,

  PromptInputComponent: StyleTransferPromptInput,

  hooks: {
    useGenerate: () => useStyleTransferAdapterWithContext(),
    // ✅ Style Transfer-specific T-Button with IMPERATIVE PROMPTS
    // Calls /api/style-transfer/generate-prompt which:
    // 1. Analyzes source image (WHAT IS in the building)
    // 2. Analyzes reference style (if provided)
    // 3. Generates imperative, action-oriented commands (HOW TO transform)
    // Example: "WINDOWS - CHANGE COMPLETELY: IDENTIFY current windows, REPLACE shapes..."
    useEnhance: () => useStyleTransferPromptEnhancerAdapter(),
    useEdit: () => useRenderEditAdapter("/api/style-transfer/edit"),
    useUpscale: useUpscaleAdapter,
  },

  generateFilename: () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `payperwork-styletransfer-${dateStr}-${timeStr}-${random}`;
  },
};

export default function StyleTransferPage() {
  return (
    <ErrorBoundary>
      <StyleTransferProvider>
        <WorkflowPage config={styleTransferConfig} />
      </StyleTransferProvider>
    </ErrorBoundary>
  );
}
