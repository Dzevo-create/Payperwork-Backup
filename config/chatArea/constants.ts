/**
 * ChatArea Constants
 * Configuration values for chat modes, models, and video settings
 */

import { AIModel, VideoModel, GPTModel } from "@/components/chat/Chat/ChatHeader";
import { VideoSettingsType } from "@/components/chat/Chat/VideoSettings";
import { ImageSettingsType } from "@/components/chat/Chat/ImageSettings";

/**
 * Default chat mode
 */
export const DEFAULT_CHAT_MODE: "chat" | "image" | "video" = "chat";

/**
 * Default AI model
 */
export const DEFAULT_AI_MODEL: AIModel = "chatgpt";

/**
 * Default GPT model (GPT-4o for speed, GPT-5 available for complex tasks)
 */
export const DEFAULT_GPT_MODEL: GPTModel = "gpt-4o";

/**
 * Default video model
 */
export const DEFAULT_VIDEO_MODEL: VideoModel = "kling";

/**
 * Default chat name
 */
export const DEFAULT_CHAT_NAME = "Neuer Chat";

/**
 * Default video settings
 */
export const DEFAULT_VIDEO_SETTINGS: VideoSettingsType = {
  duration: "5",
  aspectRatio: "16:9",
  mode: "std",
  audioEnabled: true, // Sora 2: Audio on by default
};

/**
 * Default image settings
 */
export const DEFAULT_IMAGE_SETTINGS: ImageSettingsType = {
  preset: "none",
  quality: "ultra",
  aspectRatio: "16:9",
  numImages: 1,
};

/**
 * Video model duration constraints
 */
export const VIDEO_DURATIONS = {
  sora2: ["4", "8", "12"],
  kling: ["5", "10"],
} as const;

/**
 * Default durations for each video model
 */
export const VIDEO_DEFAULT_DURATIONS = {
  sora2: "4",
  kling: "5",
} as const;

/**
 * Video generation metadata
 */
export const VIDEO_METADATA = {
  defaultModel: "payperwork-v1",
  defaultType: "text2video" as const,
  defaultStatus: "succeed" as const,
  completionProgress: 100,
};

/**
 * Video model display names for library
 */
export const VIDEO_MODEL_NAMES = {
  kling: "Payperwork Video v1",
  sora2: "Payperwork Video v2",
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  noResponseBody: "No response body",
  apiError: "Failed to get response from API",
  processingError: "Entschuldigung, es gab einen Fehler bei der Verarbeitung deiner Anfrage.",
  videoGenerationFailed: "❌ Videogenerierung fehlgeschlagen",
  videoGenerationSuccess: "✅ Video wurde erfolgreich generiert!",
} as const;

/**
 * Chat endpoints
 */
export const CHAT_ENDPOINTS = {
  standard: "/api/chat",
} as const;

/**
 * Streaming configuration
 */
export const STREAMING_CONFIG = {
  dataPrefix: "data: ",
  doneMarker: "[DONE]",
} as const;

/**
 * Notification permission request modes
 */
export const NOTIFICATION_MODES = ["video"] as const;
