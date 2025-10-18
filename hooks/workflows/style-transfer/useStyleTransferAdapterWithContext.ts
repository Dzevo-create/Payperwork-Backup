import { useStyleTransferWithContext } from "./useStyleTransferWithContext";
import type { StyleTransferSettingsType } from "@/types/workflows/styleTransferSettings";
import type { StandardGenerateHook, WorkflowGenerationResult } from "@/hooks/workflows/adapters/useWorkflowAdapter";

/**
 * Adapter for Style-Transfer Hook
 * Transforms the Style-Transfer hook to match the StandardGenerateHook interface
 */
export function useStyleTransferAdapterWithContext(): StandardGenerateHook<StyleTransferSettingsType> {
  const hook = useStyleTransferWithContext();

  return {
    generate: async (params) => {
      const { prompt, settings, sourceImage, referenceImages } = params;

      // Convert base64 preview strings to ImageData format expected by useStyleTransfer
      // useStyleTransfer expects: { file: File | null, preview: string | null }
      const sourceImageData: { file: File | null; preview: string | null } = sourceImage ? {
        file: null, // File object not needed for generation, only preview
        preview: sourceImage, // Base64 data URL
      } : { file: null, preview: null };

      const referenceImageData: { file: File | null; preview: string | null } | undefined = referenceImages.length > 0 ? {
        file: null,
        preview: referenceImages[0] || null,
      } : undefined;

      // Style-Transfer requires source image (reference image is optional)
      if (!sourceImageData.preview) {
        throw new Error("Ausgangsbild (Design) ist erforderlich");
      }

      // Call the original hook's generate function
      const result = await hook.generate(
        prompt,
        sourceImageData,
        settings,
        referenceImageData
      );

      // Transform result to match WorkflowGenerationResult interface
      if (!result) return null;

      return {
        imageUrl: result.imageUrl,
        id: result.id,
        timestamp: result.timestamp,
        prompt: result.prompt,
        settings: result.settings,
      } as WorkflowGenerationResult;
    },
    isGenerating: hook.isGenerating,
    error: hook.error,
    progress: hook.progress,
  };
}
