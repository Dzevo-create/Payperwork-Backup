/**
 * Context detection utility for prompt enhancement
 * Determines the appropriate enhancement strategy based on user input
 */

export type EnhancementContext =
  | "nano_banana"
  | "image_generate"
  | "video_generate"
  | "chat"
  | "analyze";

export interface ContextDetectionInput {
  mode?: string;
  hasImage: boolean;
  imageContext: string;
  replyContext: string;
  imageSettings?: any;
  videoContext?: string;
}

/**
 * Detects the enhancement context based on input parameters
 */
export function detectEnhancementContext(data: ContextDetectionInput): EnhancementContext {
  const { mode, hasImage, imageContext } = data;

  // Nano Banana: Image mode + attached image (editing existing image)
  if (mode === "image" && hasImage && imageContext) {
    return "nano_banana";
  }

  // Image Generation: Image mode without attached image (creating new image)
  if (mode === "image") {
    return "image_generate";
  }

  // Video Generation: Video mode
  if (mode === "video") {
    return "video_generate";
  }

  // Analyze: Has image but not in image mode (user wants to understand the image)
  if (hasImage && mode !== "image") {
    return "analyze";
  }

  // Default: Chat mode
  return "chat";
}
