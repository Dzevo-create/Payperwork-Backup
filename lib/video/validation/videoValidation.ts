/**
 * Video Generation Validation Functions
 * Shared validation logic for video API routes
 */

import type { VideoType, VideoModel } from "@/types/video";

/**
 * Validates video type parameter
 * @param type - The type to validate
 * @returns True if valid VideoType, false otherwise
 */
export function validateVideoType(type: string | null): type is VideoType {
  return type !== null && ["text2video", "image2video"].includes(type);
}

/**
 * Validates video model parameter
 * @param model - The model to validate
 * @returns True if valid VideoModel, false otherwise
 */
export function validateVideoModel(model: string | null): model is VideoModel {
  return model !== null && ["payperwork-v1", "payperwork-v2"].includes(model);
}

/**
 * Validates required video generation request fields
 * @param body - The request body to validate
 * @returns Error message if invalid, null if valid
 */
export function validateVideoGenerationRequest(body: {
  model?: string | null;
  type?: string | null;
  prompt?: string;
}): string | null {
  if (!body.model || !validateVideoModel(body.model)) {
    return "Invalid or missing model. Must be 'payperwork-v1' or 'payperwork-v2'";
  }

  if (!body.type || !validateVideoType(body.type)) {
    return "Invalid or missing type. Must be 'text2video' or 'image2video'";
  }

  if (!body.prompt || typeof body.prompt !== "string") {
    return "Invalid or missing prompt";
  }

  return null;
}

/**
 * Validates video status check request parameters
 * @param params - The query parameters to validate
 * @returns Error message if invalid, null if valid
 */
export function validateVideoStatusRequest(params: {
  task_id?: string | null;
  model?: string | null;
  type?: string | null;
}): string | null {
  if (!params.task_id) {
    return "task_id parameter is required";
  }

  if (!params.model || !validateVideoModel(params.model)) {
    return "Invalid model. Must be 'payperwork-v1' or 'payperwork-v2'";
  }

  if (!params.type || !validateVideoType(params.type)) {
    return "Invalid type. Must be 'text2video' or 'image2video'";
  }

  return null;
}
