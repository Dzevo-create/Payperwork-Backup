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
import { useRenderEditAdapter, useUpscaleAdapter } from "@/hooks/workflows";

const styleTransferConfig: WorkflowPageConfig<StyleTransferSettingsType> = {
  name: "Style Transfer",
  apiEndpoint: "style-transfer",
  defaultSettings: DEFAULT_STYLE_TRANSFER_SETTINGS,

  PromptInputComponent: StyleTransferPromptInput,

  hooks: {
    useGenerate: () => useStyleTransferAdapterWithContext(),
    // ❌ REMOVED: useEnhance - Style Transfer generates prompts automatically in backend!
    // The imperative prompts are generated in /app/api/style-transfer/route.ts using:
    // - generateReferencePromptWithStyleAnalysis() for reference mode
    // - generateStyleTransferPrompt() for preset mode
    useEdit: () => useRenderEditAdapter("/api/style-transfer/edit"), // ✅ Use style-transfer-specific edit endpoint
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
