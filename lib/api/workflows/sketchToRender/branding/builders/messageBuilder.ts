/**
 * Message Builder Module
 *
 * Builds OpenAI message arrays with images
 */

import { BRANDING_ENHANCEMENT_SYSTEM_PROMPT } from "../constants";
import { ImageData } from "../types";

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
 */
export function buildMessagesWithImages(
  userMessage: string,
  sourceImage: ImageData,
  referenceImages?: ImageData[]
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: "system", content: BRANDING_ENHANCEMENT_SYSTEM_PROMPT }
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
