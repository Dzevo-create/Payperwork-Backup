/**
 * Common Types for All Workflows
 *
 * These types ensure consistency across all workflow implementations
 * and prevent adapter mismatches.
 */

/**
 * ImageData - Standard format for image handling across all workflows
 *
 * @property file - File object (optional, not needed for API calls)
 * @property preview - Base64 data URL string (required for generation)
 *
 * @example
 * ```typescript
 * const imageData: ImageData = {
 *   file: null,
 *   preview: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 * };
 * ```
 */
export interface ImageData {
  file: File | null;
  preview: string | null;
}

/**
 * GenerationResult - Standard format for generation results
 */
export interface GenerationResult {
  id: string;
  imageUrl: string;
  timestamp: Date;
  prompt?: string;
  enhancedPrompt?: string;
  settings?: any;
}

/**
 * WorkflowHookOptions - Standard options for workflow hooks
 */
export interface WorkflowHookOptions {
  onSuccess?: (result: GenerationResult) => void;
  onError?: (error: string) => void;
}
