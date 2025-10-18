/**
 * Sketch-to-Render Workflow Library
 *
 * Centralized exports for all sketch-to-render backend functions.
 * Import from this file to access all workflow utilities.
 *
 * @example
 * ```typescript
 * import {
 *   buildArchitecturalPrompt,
 *   enhanceArchitecturalPrompt,
 *   enhanceSketchToRenderPrompt,
 *   prepareImagesForGeneration,
 *   validateImages
 * } from "@/lib/api/workflows/sketchToRender";
 * ```
 */

// Prompt Building
export {
  buildArchitecturalPrompt,
  validateRenderSettings,
} from "./promptBuilder";

// Image Processing
export {
  prepareImagesForGeneration,
  validateImages,
  validateSourceImage,
  validateReferenceImages,
  extractMimeType,
  stripDataUrlPrefix,
  fileToImageData,
} from "./imageProcessor";

export type {
  ImageData,
  GeminiImagePart,
  ValidationResult,
} from "./imageProcessor";

// GPT Enhancement
export {
  enhanceArchitecturalPrompt,
  enhanceSketchToRenderPrompt,
  enhanceArchitecturalPromptBatch,
  enhanceArchitecturalPromptWithOptions,
} from "./gptEnhancer";

export type {
  EnhancementOptions,
} from "./gptEnhancer";

// T-Button Prompt Generator (Dedicated for Sketch-to-Render)
export { generateSketchToRenderPrompt } from "./promptGenerator";

// Branding Enhancement (Brand Intelligence Integration)
export {
  enhanceBrandingPrompt,
  generateBrandingPrompt,
} from "./branding";
