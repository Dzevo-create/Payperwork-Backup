/**
 * Message Builder Module
 *
 * Builds OpenAI message arrays with images
 */

import { getBrandingSystemPrompt } from "../constants";
import { ImageData } from "../types";
import { apiLogger } from "@/lib/logger";

// OpenAI message content types
interface TextContent {
  type: "text";
  text: string;
}

interface ImageUrlContent {
  type: "image_url";
  image_url: {
    url: string;
  };
}

type MessageContent = TextContent | ImageUrlContent;

interface ChatMessage {
  role: "system" | "user";
  content: string | MessageContent[];
}

/**
 * Builds OpenAI messages array with images
 * @param spaceType - "interior" or "exterior" - determines which system prompt to use
 */
export function buildMessagesWithImages(
  userMessage: string,
  sourceImage: ImageData,
  referenceImages?: ImageData[],
  spaceType?: "interior" | "exterior" | null
): ChatMessage[] {
  // Use appropriate system prompt based on space type
  const systemPrompt = getBrandingSystemPrompt(spaceType);

  // Log which system prompt is being used
  apiLogger.info("🔍 Message Builder: System Prompt Selection", {
    spaceType: spaceType || "not-set",
    promptType: spaceType === "exterior" ? "EXTERIOR (strict)" : "INTERIOR (default)",
    promptLength: systemPrompt.length,
    containsForbiddenWarning: systemPrompt.includes("FORBIDDEN")
  });

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt }
  ];

  const userContent: MessageContent[] = [{ type: "text", text: userMessage }];

  // Add reference images first (if provided)
  if (referenceImages && referenceImages.length > 0) {
    for (const refImage of referenceImages) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${refImage.mimeType};base64,${refImage.data}`,
        },
      });
    }
  }

  // Add source image LAST (important for context)
  userContent.push({
    type: "image_url",
    image_url: {
      url: `data:${sourceImage.mimeType};base64,${sourceImage.data}`,
    },
  });

  messages.push({ role: "user", content: userContent });

  return messages;
}
