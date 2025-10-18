/**
 * Workflow Hooks - Central Export
 *
 * This file provides a central export point for all workflow hooks,
 * organized by category for better maintainability.
 */

// ===== COMMON HOOKS =====
// Shared across all workflows
export { usePromptEnhancer } from './common/usePromptEnhancer';
export { useRenderEdit } from './common/useRenderEdit';
export { useUpscale } from './common/useUpscale';
export { useImageCrop, type CropImageType } from './common/useImageCrop';
export { useRecentGenerations } from './common/useRecentGenerations';
export { useWorkflowLightbox } from './common/useWorkflowLightbox';
export { useWorkflowState } from './common/useWorkflowState';
export { useWorkflowHandlers } from './common/useWorkflowHandlers';

// ===== WORKFLOW-SPECIFIC HOOKS =====
// Sketch-to-Render
export { useSketchToRender } from './sketch-to-render/useSketchToRender';

// Branding
export { useBranding } from './branding/useBranding';

// Furnish-Empty
export { useFurnishEmpty } from './furnish-empty/useFurnishEmpty';

// ===== ADAPTERS =====
// Standardized interface adapters for WorkflowPage
export {
  useSketchToRenderAdapter,
  useBrandingAdapter,
  useFurnishEmptyAdapter,
  usePromptEnhancerAdapter,
  useRenderEditAdapter,
  useUpscaleAdapter,
  type StandardGenerateHook,
  type StandardEnhanceHook,
  type StandardEditHook,
  type StandardUpscaleHook,
} from './adapters/useWorkflowAdapter';
