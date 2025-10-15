/**
 * Helper functions for ChatInput configuration
 */

import { Message, Attachment } from "@/types/chat";
import { UI_TEXT } from "./constants";

/**
 * Format reply preview text based on message content
 * @param message - The message being replied to
 * @returns Formatted preview text
 */
export function formatReplyPreviewText(message: Message): string {
  // Check for image attachments
  const imageAttachment = message.attachments?.find(
    (att) => att.type === "image"
  );
  if (imageAttachment) {
    return UI_TEXT.replyPreview.contextImage.replace(
      "{name}",
      imageAttachment.name || "Bild"
    );
  }

  // Check for other attachments
  const attachment = message.attachments?.[0];
  if (attachment) {
    return UI_TEXT.replyPreview.contextFile.replace(
      "{name}",
      attachment.name || "Anhang"
    );
  }

  // Fallback to content or default text
  return message.content || UI_TEXT.replyPreview.contextFallback;
}

/**
 * Calculate optimal textarea height based on content
 * @param scrollHeight - Current scroll height of textarea
 * @param maxHeight - Maximum allowed height
 * @returns Calculated height in pixels
 */
export function calculateTextareaHeight(
  scrollHeight: number,
  maxHeight: number = 200
): number {
  return Math.min(scrollHeight, maxHeight);
}

/**
 * Check if attachments contain images
 * @param attachments - Array of attachments
 * @returns True if any attachment is an image
 */
export function hasImageAttachments(attachments: Attachment[]): boolean {
  return attachments.some((att) => att.type === "image");
}

/**
 * Validate if message can be sent
 * @param message - Message text
 * @param attachments - Array of attachments
 * @returns True if message can be sent
 */
export function canSendMessage(
  message: string,
  attachments: Attachment[]
): boolean {
  return message.trim().length > 0 || attachments.length > 0;
}

/**
 * Get file input accept attribute based on allowed types
 * @param allowImages - Allow image files
 * @param allowPDFs - Allow PDF files
 * @returns File input accept string
 */
export function getFileAcceptAttribute(
  allowImages: boolean = true,
  allowPDFs: boolean = true
): string {
  const types: string[] = [];
  if (allowImages) types.push("image/*");
  if (allowPDFs) types.push(".pdf");
  return types.join(",");
}
