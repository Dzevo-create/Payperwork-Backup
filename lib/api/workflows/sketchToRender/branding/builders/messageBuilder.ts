/**
 * Message Builder Module
 *
 * Builds OpenAI message arrays with images
 */

import { BRANDING_ENHANCEMENT_SYSTEM_PROMPT } from "../constants";
import { ImageData } from "../types";

/**
 * Builds OpenAI messages array with images
 */
export function buildMessagesWithImages(
  userMessage: string,
  sourceImage: ImageData,
  referenceImages?: ImageData[]
): any[] {
  const messages: any[] = [
    { role: "system", content: BRANDING_ENHANCEMENT_SYSTEM_PROMPT }
  ];

  const userContent: any[] = [{ type: "text", text: userMessage }];

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
