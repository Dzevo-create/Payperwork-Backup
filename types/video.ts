/**
 * Unified type definitions for video generation system
 */

/**
 * Video generation model selection
 * - payperwork-v1: Uses Kling AI (high quality, slower, advanced features)
 * - payperwork-v2: Uses fal.ai Sora 2 (faster, different style)
 */
export type VideoModel = "payperwork-v1" | "payperwork-v2";

/**
 * Video generation type
 * - text2video: Generate video from text prompt only
 * - image2video: Generate video from image + optional text prompt
 */
export type VideoType = "text2video" | "image2video";

/**
 * Video generation status
 */
export type VideoStatus = "processing" | "succeed" | "failed";

/**
 * Video provider
 */
export type VideoProvider = "kling" | "fal";

/**
 * Unified request body for video generation
 */
export interface VideoGenerationRequest {
  // Model & type selection (REQUIRED)
  model: VideoModel;
  type: VideoType;

  // Common parameters (all models)
  prompt: string;
  negative_prompt?: string;

  // Image-to-video specific
  image?: string; // Base64 or URL
  image_tail?: string; // Optional end frame (Kling only)

  // Video settings (provider-specific defaults apply)
  duration?: string; // "4" | "5" | "8" | "10" | "12"
  aspectRatio?: string; // "16:9" | "9:16" | "1:1" | "original"
  mode?: "std" | "pro"; // Kling only
  cfg_scale?: number; // 0.0-1.0, Kling only
  resolution?: string; // "720p" | "1080p", fal.ai only

  // Advanced Kling features
  static_mask?: string; // Static mask for motion control
  dynamic_masks?: any[]; // Dynamic masks for motion control
}

/**
 * Unified response format for all providers
 */
export interface VideoGenerationResponse {
  task_id: string;
  status: VideoStatus;
  videos?: Array<{ url: string }>;
  message: string;
  error?: string;
  provider?: VideoProvider;
  model?: VideoModel;
  type?: VideoType;
}

/**
 * Video task metadata (for frontend state management)
 */
export interface VideoTask {
  taskId: string;
  status: VideoStatus;
  model: VideoModel;
  type: VideoType;
  error?: string;
}
