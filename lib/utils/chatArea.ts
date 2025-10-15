/**
 * ChatArea utility functions
 * Helper functions for chat message handling and context image management
 */

import { Message, Attachment } from "@/types/chat";
import { convertImageUrlToBase64 } from "@/lib/imageUtils";
import { getCachedBase64 } from "@/lib/utils/imageCache";

/**
 * Convert image attachments to base64 format for API consumption
 * Uses caching to avoid redundant conversions
 */
export async function convertAttachmentsToBase64(
  attachments: Attachment[]
): Promise<Attachment[]> {
  const conversions = await Promise.all(
    attachments.map(async (att) => {
      try {
        const base64 = await getCachedBase64(att.url, convertImageUrlToBase64);
        return {
          type: att.type,
          url: att.url,
          name: att.name,
          base64: base64,
        };
      } catch (error) {
        console.error(`Failed to convert image ${att.name}:`, error);
        return null;
      }
    })
  );

  return conversions.filter((img): img is Attachment & { base64: string } => img !== null);
}

/**
 * Extract image attachments from a message's reply context
 */
export async function getReplyContextImages(
  replyTo: Message | undefined
): Promise<Attachment[]> {
  if (!replyTo?.attachments?.length) {
    return [];
  }

  const imageAttachments = replyTo.attachments.filter((att) => att.type === "image");
  if (imageAttachments.length === 0) {
    return [];
  }

  return convertAttachmentsToBase64(imageAttachments);
}

/**
 * Extract image attachments from the last assistant message
 */
export async function getLastAssistantImages(
  messages: Message[],
  mode: "chat" | "image" | "video",
  hasUserAttachments: boolean
): Promise<Attachment[]> {
  // Only in chat mode and if user didn't provide their own attachments
  if (mode !== "chat" || messages.length === 0 || hasUserAttachments) {
    return [];
  }

  const lastMessage = messages[messages.length - 1];

  // Only if last message is from assistant and has image attachments
  if (lastMessage.role !== "assistant" || !lastMessage.attachments?.length) {
    return [];
  }

  const imageAttachments = lastMessage.attachments.filter((att) => att.type === "image");
  if (imageAttachments.length === 0) {
    return [];
  }

  return convertAttachmentsToBase64(imageAttachments);
}

/**
 * Get context images for a message based on reply state or last assistant message
 */
export async function getContextImages(
  replyTo: Message | undefined,
  messages: Message[],
  mode: "chat" | "image" | "video",
  userAttachments?: Attachment[]
): Promise<Attachment[]> {
  // Priority 1: If replying to a message, use its attachments
  if (replyTo) {
    return getReplyContextImages(replyTo);
  }

  // Priority 2: If in chat mode and last message has images, use those as context
  return getLastAssistantImages(messages, mode, !!userAttachments?.length);
}

/**
 * Create a new conversation ID
 */
export function createConversationId(): string {
  return Date.now().toString();
}

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return Date.now().toString();
}

/**
 * Generate a video filename with timestamp
 */
export function generateVideoFilename(): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `payperwork-${dateStr}-${timeStr}.mp4`;
}

/**
 * Build conversation object for Supabase
 */
export function buildNewConversation(
  id: string,
  title: string = "Neuer Chat",
  isSuperChatEnabled: boolean = false
) {
  return {
    id,
    title,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isSuperChatEnabled,
  };
}
