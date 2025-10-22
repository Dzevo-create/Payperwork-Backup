/**
 * Workflow Hook Adapters
 *
 * These adapters wrap existing workflow hooks to provide a standardized interface
 * that the generic WorkflowPage component expects.
 *
 * This allows us to reuse existing hooks without modifying them.
 */

import { useSketchToRender } from "../sketch-to-render/useSketchToRender";
import { useBranding } from "../branding/useBranding";
import { useBrandingPromptEnhancer } from "../branding/useBrandingPromptEnhancer";
import { useFurnishEmpty } from "../furnish-empty/useFurnishEmpty";
import { useStyleTransfer } from "../style-transfer/useStyleTransfer";
import { useRenderToCad } from "../render-to-cad/useRenderToCad";
import { useRenderToCadEnhancer } from "../render-to-cad/useRenderToCadEnhancer";
import { usePromptEnhancer } from "../common/usePromptEnhancer";
import { useRenderEdit } from "../common/useRenderEdit";
import { useUpscale } from "../common/useUpscale";
import type { SketchToRenderSettingsType } from "@/types/workflows/sketchToRenderSettings";
import type { BrandingSettingsType } from "@/types/workflows/brandingSettings";
import type { FurnishEmptySettingsType } from "@/types/workflows/furnishEmptySettings";
import type { StyleTransferSettingsType } from "@/types/workflows/styleTransferSettings";
import type { RenderToCadSettingsType } from "@/types/workflows/renderToCadSettings";

/**
 * Workflow Generation Result Interface
 */
export interface WorkflowGenerationResult {
  imageUrl: string;
  id?: string;
  timestamp?: Date;
  prompt?: string;
  settings?: Record<string, unknown>;
}

/**
 * Standard Generate Hook Interface
 */
export interface StandardGenerateHook<TSettings = Record<string, unknown>> {
  generate: (params: {
    prompt: string;
    settings: TSettings;
    sourceImage: string | null;
    referenceImages: (string | null)[];
  }) => Promise<WorkflowGenerationResult | null>;
  isGenerating: boolean;
  error: string | null;
  progress: number;
}

/**
 * Standard Enhance Hook Interface
 */
export interface StandardEnhanceHook {
  enhance: (prompt: string) => Promise<string>;
  isEnhancing: boolean;
  error: string | null;
}

/**
 * Standard Edit Hook Interface
 */
export interface StandardEditHook {
  edit: (params: {
    editPrompt: string;
    currentImageUrl: string;
    originalPrompt?: string;
    referenceImages?: string[];
  }) => Promise<WorkflowGenerationResult | null>;
  isEditing: boolean;
  error: string | null;
}

/**
 * Standard Upscale Hook Interface
 */
export interface StandardUpscaleHook {
  upscale: (params: { imageUrl: string }) => Promise<string | null>;
  isUpscaling: boolean;
  error: string | null;
}

/**
 * Adapter for Sketch-to-Render Hook
 */
export function useSketchToRenderAdapter(): StandardGenerateHook<SketchToRenderSettingsType> {
  const hook = useSketchToRender();

  return {
    generate: async (params) => {
      const { prompt, settings, sourceImage, referenceImages } = params;

      // Convert base64 preview string to ImageData format expected by useSketchToRender
      // useSketchToRender expects: { file: File | null, preview: string | null }
      const sourceImageData: { file: File | null; preview: string | null } = sourceImage
        ? {
            file: null, // File object not needed for generation, only preview
            preview: sourceImage, // Base64 data URL
          }
        : { file: null, preview: null };

      const referenceImageData: { file: File | null; preview: string | null } | undefined =
        referenceImages.length > 0
          ? {
              file: null,
              preview: referenceImages[0] || null,
            }
          : undefined;

      const result = await hook.generate(
        prompt,
        sourceImageData as any,
        settings as SketchToRenderSettingsType,
        referenceImageData as any
      );

      return result;
    },
    isGenerating: hook.isGenerating,
    error: hook.error,
    progress: hook.progress,
  };
}

/**
 * Adapter for Branding Hook
 */
export function useBrandingAdapter(): StandardGenerateHook<BrandingSettingsType> {
  const hook = useBranding();

  return {
    generate: async (params) => {
      const { prompt, settings, sourceImage, referenceImages } = params;

      // Convert base64 preview string to ImageData format expected by useBranding
      // useBranding expects: { file: File | null, preview: string | null }
      const sourceImageData: { file: File | null; preview: string | null } = sourceImage
        ? {
            file: null, // File object not needed for generation, only preview
            preview: sourceImage, // Base64 data URL
          }
        : { file: null, preview: null };

      const referenceImageData: { file: File | null; preview: string | null } | undefined =
        referenceImages.length > 0
          ? {
              file: null,
              preview: referenceImages[0] || null,
            }
          : undefined;

      const result = await hook.generate(
        prompt,
        sourceImageData as any,
        settings as SketchToRenderSettingsType,
        referenceImageData as any
      );

      return result;
    },
    isGenerating: hook.isGenerating,
    error: hook.error,
    progress: hook.progress,
  };
}

/**
 * Adapter for Furnish-Empty Hook (without context)
 * Note: Use useFurnishEmptyAdapterWithContext for furniture images support
 */
export function useFurnishEmptyAdapter(): StandardGenerateHook<FurnishEmptySettingsType> {
  const hook = useFurnishEmpty();

  return {
    generate: async (params) => {
      const { prompt, settings, sourceImage, referenceImages } = params;

      // Convert base64 preview string to ImageData format expected by useFurnishEmpty
      // useFurnishEmpty expects: { file: File | null, preview: string | null }
      const sourceImageData: { file: File | null; preview: string | null } = sourceImage
        ? {
            file: null, // File object not needed for generation, only preview
            preview: sourceImage, // Base64 data URL
          }
        : { file: null, preview: null };

      const referenceImageData: { file: File | null; preview: string | null } | undefined =
        referenceImages.length > 0
          ? {
              file: null,
              preview: referenceImages[0] || null,
            }
          : undefined;

      const result = await hook.generate(
        prompt,
        sourceImageData as any,
        settings as FurnishEmptySettingsType,
        referenceImageData as any
      );

      return result;
    },
    isGenerating: hook.isGenerating,
    error: hook.error,
    progress: hook.progress,
  };
}

/**
 * Adapter for Style-Transfer Hook
 */
export function useStyleTransferAdapter(): StandardGenerateHook<StyleTransferSettingsType> {
  const hook = useStyleTransfer();

  return {
    generate: async (params) => {
      const { prompt, settings, sourceImage, referenceImages } = params;

      // Convert base64 preview string to ImageData format expected by useStyleTransfer
      // useStyleTransfer expects: { file: File | null, preview: string | null }
      const sourceImageData: { file: File | null; preview: string | null } = sourceImage
        ? {
            file: null, // File object not needed for generation, only preview
            preview: sourceImage, // Base64 data URL
          }
        : { file: null, preview: null };

      // Reference image is optional for Style-Transfer
      const referenceImageData: { file: File | null; preview: string | null } | undefined =
        referenceImages.length > 0
          ? {
              file: null,
              preview: referenceImages[0] || null,
            }
          : undefined;

      const result = await hook.generate(
        prompt,
        sourceImageData as any,
        settings as StyleTransferSettingsType,
        referenceImageData as any
      );

      return result;
    },
    isGenerating: hook.isGenerating,
    error: hook.error,
    progress: hook.progress,
  };
}

/**
 * Adapter for Render-to-CAD Hook
 */
export function useRenderToCadAdapter(): StandardGenerateHook<RenderToCadSettingsType> {
  const hook = useRenderToCad();

  return {
    generate: async (params) => {
      const { prompt, settings, sourceImage } = params;

      // Convert base64 preview string to ImageData format expected by useRenderToCad
      // useRenderToCad expects: { file: File | null, preview: string | null }
      const sourceImageData: { file: File | null; preview: string | null } = sourceImage
        ? {
            file: null, // File object not needed for generation, only preview
            preview: sourceImage, // Base64 data URL
          }
        : { file: null, preview: null };

      const result = await hook.generate(
        prompt,
        sourceImageData as any,
        settings as RenderToCadSettingsType
      );

      return result;
    },
    isGenerating: hook.isGenerating,
    error: hook.error,
    progress: hook.progress,
  };
}

/**
 * Adapter for Prompt Enhancer Hook (Sketch-to-Render)
 */
export function usePromptEnhancerAdapter(
  sourceImage: string | null,
  settings: Record<string, unknown>
): StandardEnhanceHook {
  const hook = usePromptEnhancer();

  return {
    enhance: async (prompt: string) => {
      if (!sourceImage) {
        return prompt; // Can't enhance without source image
      }

      // Convert base64 to File object for validation
      const response = await fetch(sourceImage);
      const blob = await response.blob();
      const file = new File([blob], "source-image.jpg", { type: "image/jpeg" });

      // Convert to ImageData format expected by usePromptEnhancer
      const sourceImageData = {
        file,
        preview: sourceImage,
      };

      const result = await hook.enhancePrompt(prompt, sourceImageData as any, settings);

      return result || prompt;
    },
    isEnhancing: hook.isEnhancing,
    error: hook.error,
  };
}

/**
 * Adapter for Branding Prompt Enhancer Hook
 * Uses workflow-specific endpoint with Two-Stage Enhancement:
 * - Stage 1: GPT-4o Vision analyzes structure WITHOUT brand details
 * - Stage 2: GPT-4o combines structure WITH exact brand guidelines
 */
export function useBrandingPromptEnhancerAdapter(
  sourceImage: string | null,
  settings: Record<string, unknown>
): StandardEnhanceHook {
  const hook = useBrandingPromptEnhancer();

  return {
    enhance: async (prompt: string) => {
      if (!sourceImage) {
        return prompt; // Can't enhance without source image
      }

      // Convert base64 to File object for validation
      const response = await fetch(sourceImage);
      const blob = await response.blob();
      const file = new File([blob], "source-image.jpg", { type: "image/jpeg" });

      // Convert to ImageData format expected by useBrandingPromptEnhancer
      const sourceImageData = {
        file,
        preview: sourceImage,
      };

      const result = await hook.enhancePrompt(
        prompt,
        sourceImageData as any,
        settings as BrandingSettingsType
      );

      return result || prompt;
    },
    isEnhancing: hook.isEnhancing,
    error: hook.error,
  };
}

/**
 * Adapter for Render-to-CAD Prompt Enhancer Hook
 * Uses workflow-specific endpoint: /api/render-to-cad/generate-prompt
 */
export function useRenderToCadEnhancerAdapter(
  sourceImage: string | null,
  settings: Record<string, unknown>
): StandardEnhanceHook {
  const hook = useRenderToCadEnhancer();

  return {
    enhance: async (prompt: string) => {
      if (!sourceImage) {
        return prompt; // Can't enhance without source image
      }

      // Convert base64 to File object for validation
      const response = await fetch(sourceImage);
      const blob = await response.blob();
      const file = new File([blob], "source-image.jpg", { type: "image/jpeg" });

      // Convert to ImageData format expected by useRenderToCadEnhancer
      const sourceImageData = {
        file,
        preview: sourceImage,
      };

      const result = await hook.enhancePrompt(
        prompt,
        sourceImageData as any,
        settings as RenderToCadSettingsType
      );

      return result || prompt;
    },
    isEnhancing: hook.isEnhancing,
    error: hook.error,
  };
}

/**
 * Adapter for Render Edit Hook
 *
 * ✅ NEW: Accepts optional apiEndpoint to use workflow-specific edit endpoints
 * @param apiEndpoint - Optional API endpoint (e.g., "/api/style-transfer/edit", "/api/branding/edit")
 *                      Defaults to "/api/sketch-to-render/edit" for backward compatibility
 */
export function useRenderEditAdapter(apiEndpoint?: string): StandardEditHook {
  const hook = useRenderEdit({ apiEndpoint });

  return {
    edit: async (params) => {
      const { editPrompt, currentImageUrl, originalPrompt, referenceImages } = params;
      const imageUrl = await hook.editRender(
        editPrompt,
        currentImageUrl,
        originalPrompt,
        referenceImages
      );

      if (!imageUrl) {
        return null;
      }

      // Wrap the string result in WorkflowGenerationResult
      return {
        imageUrl,
        id: Date.now().toString(),
        timestamp: new Date(),
        prompt: originalPrompt,
      };
    },
    isEditing: hook.isEditing,
    error: hook.error,
  };
}

/**
 * Adapter for Upscale Hook
 */
export function useUpscaleAdapter(): StandardUpscaleHook {
  const hook = useUpscale();

  return {
    upscale: async (params) => {
      const { imageUrl } = params;
      return await hook.upscale(imageUrl);
    },
    isUpscaling: hook.isUpscaling,
    error: hook.error,
  };
}
