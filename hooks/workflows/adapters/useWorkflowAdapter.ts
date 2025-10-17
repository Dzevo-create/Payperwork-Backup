/**
 * Workflow Hook Adapters
 *
 * These adapters wrap existing workflow hooks to provide a standardized interface
 * that the generic WorkflowPage component expects.
 *
 * This allows us to reuse existing hooks without modifying them.
 */

import { useSketchToRender } from '../sketch-to-render/useSketchToRender';
import { useBranding } from '../branding/useBranding';
import { usePromptEnhancer } from '../common/usePromptEnhancer';
import { useRenderEdit } from '../common/useRenderEdit';
import { useUpscale } from '../common/useUpscale';
import type { RenderSettingsType } from '@/types/workflows/renderSettings';

/**
 * Standard Generate Hook Interface
 */
export interface StandardGenerateHook {
  generate: (params: {
    prompt: string;
    settings: any;
    sourceImage: string | null;
    referenceImages: string[];
  }) => Promise<any>;
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
  }) => Promise<string | null>;
  isEditing: boolean;
  error: string | null;
}

/**
 * Standard Upscale Hook Interface
 */
export interface StandardUpscaleHook {
  upscale: (params: {
    imageUrl: string;
  }) => Promise<string | null>;
  isUpscaling: boolean;
  error: string | null;
}

/**
 * Adapter for Sketch-to-Render Hook
 */
export function useSketchToRenderAdapter(): StandardGenerateHook {
  const hook = useSketchToRender();

  return {
    generate: async (params) => {
      const { prompt, settings, sourceImage, referenceImages } = params;

      // Convert base64 preview string to ImageData format expected by useSketchToRender
      // useSketchToRender expects: { file: File | null, preview: string | null }
      const sourceImageData = sourceImage ? {
        file: null, // File object not needed for generation, only preview
        preview: sourceImage, // Base64 data URL
      } : {file: null, preview: null};

      const referenceImageData = referenceImages.length > 0 ? {
        file: null,
        preview: referenceImages[0],
      } : undefined;

      const result = await hook.generate(
        prompt,
        sourceImageData,
        settings as RenderSettingsType,
        referenceImageData
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
export function useBrandingAdapter(): StandardGenerateHook {
  const hook = useBranding();

  return {
    generate: async (params) => {
      const { prompt, settings, sourceImage, referenceImages } = params;

      // Convert base64 preview string to ImageData format expected by useBranding
      // useBranding expects: { file: File | null, preview: string | null }
      const sourceImageData = sourceImage ? {
        file: null, // File object not needed for generation, only preview
        preview: sourceImage, // Base64 data URL
      } : {file: null, preview: null};

      const referenceImageData = referenceImages.length > 0 ? {
        file: null,
        preview: referenceImages[0],
      } : undefined;

      const result = await hook.generate(
        prompt,
        sourceImageData,
        settings as RenderSettingsType,
        referenceImageData
      );

      return result;
    },
    isGenerating: hook.isGenerating,
    error: hook.error,
    progress: hook.progress,
  };
}

/**
 * Adapter for Prompt Enhancer Hook
 */
export function usePromptEnhancerAdapter(
  sourceImage: string | null,
  settings: any
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
      const file = new File([blob], 'source-image.jpg', { type: 'image/jpeg' });

      // Convert to ImageData format expected by usePromptEnhancer
      const sourceImageData = {
        file,
        preview: sourceImage,
      };

      const result = await hook.enhancePrompt(
        prompt,
        sourceImageData as any,
        settings
      );

      return result || prompt;
    },
    isEnhancing: hook.isEnhancing,
    error: hook.error,
  };
}

/**
 * Adapter for Render Edit Hook
 */
export function useRenderEditAdapter(): StandardEditHook {
  const hook = useRenderEdit();

  return {
    edit: async (params) => {
      const { editPrompt, currentImageUrl, originalPrompt } = params;
      return await hook.editRender(editPrompt, currentImageUrl, originalPrompt);
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
