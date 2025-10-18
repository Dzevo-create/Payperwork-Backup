/**
 * Sketch-to-Render API Type Definitions
 *
 * Defines request and response types for the Sketch-to-Render workflow API.
 */

import { SketchToRenderSettingsType as RenderSettingsType } from "./sketchToRenderSettings";

/**
 * Image data structure for API requests/responses
 * Contains base64-encoded image data and MIME type
 */
export interface ImageData {
  /** Base64-encoded image data */
  data: string;
  /** MIME type (e.g., "image/png", "image/jpeg") */
  mimeType: string;
}

/**
 * Request payload for Sketch-to-Render API
 */
export interface SketchToRenderRequest {
  /** Source sketch/image to be rendered */
  sourceImage: ImageData;

  /** Optional reference images for style/design guidance */
  referenceImages?: ImageData[];

  /** Optional text prompt for additional guidance */
  prompt?: string;

  /** Optional render settings configuration */
  settings?: RenderSettingsType;
}

/**
 * Metadata returned with render response
 */
export interface RenderMetadata {
  /** Original prompt provided by user */
  prompt: string;

  /** AI-enhanced prompt used for generation (if applicable) */
  enhancedPrompt?: string;

  /** Render settings used for generation */
  settings?: RenderSettingsType;

  /** ISO timestamp of when the render was generated */
  timestamp: string;

  /** Optional: Generation ID for tracking */
  generationId?: string;

  /** Optional: Model version used for generation */
  modelVersion?: string;
}

/**
 * Response from Sketch-to-Render API
 */
export interface SketchToRenderResponse {
  /** Generated render image */
  image: ImageData;

  /** Metadata about the generation */
  metadata: RenderMetadata;
}

/**
 * Error response structure for API errors
 */
export interface SketchToRenderError {
  /** Error code for categorization */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Optional: Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Progress update during render generation
 * Used for streaming/progress updates
 */
export interface RenderProgress {
  /** Current step in the rendering process */
  step: "uploading" | "processing" | "generating" | "finalizing" | "complete";

  /** Progress percentage (0-100) */
  progress: number;

  /** Optional: Current step description */
  message?: string;
}

/**
 * Type guard to check if response is an error
 */
export const isSketchToRenderError = (
  response: unknown
): response is SketchToRenderError => {
  return (
    typeof response === "object" &&
    response !== null &&
    "code" in response &&
    "message" in response
  );
};
