/**
 * Message builder utilities
 * Helper functions for constructing Message objects
 */

import { Message, Attachment } from "@/types/chat";
import { generateMessageId } from "./chatArea";
import { ImageSettingsType } from "@/components/chat/Chat/ImageSettings";

interface UserMessageParams {
  content: string;
  attachments?: Attachment[];
  replyTo?: Message;
  replyAttachments?: Attachment[];
}

interface AssistantMessageParams {
  mode: "chat" | "image" | "video";
  imageSettings?: ImageSettingsType;
  isSuperChatEnabled?: boolean; // If true, this message will use C1 API
}

/**
 * Build a user message object
 */
export function buildUserMessage(params: UserMessageParams): Message {
  const { content, attachments = [], replyTo, replyAttachments = [] } = params;

  // Combine user-uploaded attachments with reply attachments for display
  const allAttachments = [...attachments, ...replyAttachments];

  return {
    id: generateMessageId(),
    role: "user",
    content,
    timestamp: new Date(),
    attachments: allAttachments,
    replyTo: replyTo
      ? {
          messageId: replyTo.id,
          content: replyTo.content,
          // Don't store attachments in replyTo to avoid localStorage overflow
        }
      : undefined,
  };
}

/**
 * Build an assistant message placeholder
 */
export function buildAssistantMessage(params: AssistantMessageParams): Message {
  const { mode, imageSettings, isSuperChatEnabled } = params;

  return {
    id: generateMessageId(),
    role: "assistant",
    content: "",
    timestamp: new Date(),
    generationType: mode === "image" ? "image" : mode === "video" ? "video" : "text",
    generationAttempt: mode === "image" ? 1 : undefined,
    generationMaxAttempts: mode === "image" ? 3 : undefined,
    // C1 flags - if SuperChat is enabled in chat mode, mark this message
    wasGeneratedWithC1: mode === "chat" && isSuperChatEnabled ? true : undefined,
    isC1Streaming: mode === "chat" && isSuperChatEnabled ? true : undefined,
    imageTask:
      mode === "image" && imageSettings
        ? {
            aspectRatio: imageSettings.aspectRatio,
            quality: imageSettings.quality,
            style: imageSettings.style,
            lighting: imageSettings.lighting,
          }
        : undefined,
  };
}

/**
 * Prepare messages for API request
 * Filters out assistant image attachments (OpenAI doesn't allow them)
 */
export function prepareMessagesForAPI(
  messages: Message[],
  userMessage: Message,
  contextImages: Attachment[]
): Array<{
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}> {
  return [...messages, userMessage].map((msg, idx) => {
    // For the user message we just added, include context images if any
    const isCurrentUserMessage = idx === messages.length && msg.role === "user";
    const finalAttachments =
      isCurrentUserMessage && contextImages.length > 0
        ? [...(msg.attachments || []), ...contextImages]
        : msg.attachments;

    return {
      role: msg.role,
      content: msg.content,
      // OpenAI doesn't allow images in assistant messages, only in user messages
      attachments: msg.role === "assistant" ? undefined : finalAttachments,
    };
  });
}
