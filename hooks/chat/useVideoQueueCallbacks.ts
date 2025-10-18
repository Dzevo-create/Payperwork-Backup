/**
 * useVideoQueueCallbacks Hook
 *
 * Provides callbacks for video queue integration (onVideoReady, onVideoFailed, onProgressUpdate).
 * Extracted from ChatArea.tsx for better separation of concerns.
 *
 * This hook encapsulates the complex 91-line onVideoReady logic that was previously
 * inline in ChatArea.tsx.
 */

import { useChatStore } from "@/store/chatStore.supabase";
import { Message } from "@/types/chat";
import { chatLogger } from '@/lib/logger';
import {
  generateVideoFilename,
} from "@/lib/utils/chatArea";
import {
  ERROR_MESSAGES,
  VIDEO_METADATA,
  VIDEO_MODEL_NAMES,
} from "@/config/chatArea";

interface UseVideoQueueCallbacksParams {
  currentConversationId: string | null;
  messages: Message[];
  addToLibrary: (item: {
    type: "image" | "video";
    url: string;
    name: string;
    prompt?: string;
    model?: string;
    messageId?: string;
    conversationId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
}

export function useVideoQueueCallbacks({
  currentConversationId,
  messages,
  addToLibrary,
}: UseVideoQueueCallbacksParams) {
  const updateMessageWithAttachments = useChatStore((state) => state.updateMessageWithAttachments);
  const updateMessage = useChatStore((state) => state.updateMessage);

  const onVideoReady = async (messageId: string, videoUrl: string) => {
    chatLogger.debug('🔥 onVideoReady CALLED IN ChatArea:', { messageId, videoUrl });

    const fileName = generateVideoFilename();

    // Get the message to retrieve the actual video settings
    const message = messages.find((m) => m.id === messageId);
    const videoTask = message?.videoTask;

    chatLogger.debug('🔧 Calling updateMessageWithAttachments with:', {
      messageId,
      fileName,
      videoUrl,
      preservedMetadata: videoTask,
    });

    // Preserve actual video settings from the message's videoTask instead of using hardcoded defaults
    updateMessageWithAttachments(
      messageId,
      ERROR_MESSAGES.videoGenerationSuccess,
      [{ type: "video", url: videoUrl, name: fileName }],
      {
        status: "succeed",
        taskId: videoTask?.taskId || "",
        model: (videoTask?.model || VIDEO_METADATA.defaultModel) as "payperwork-v1" | "payperwork-v2",
        type: videoTask?.type || VIDEO_METADATA.defaultType,
        duration: videoTask?.duration || "5",
        aspectRatio: videoTask?.aspectRatio || "16:9",
        progress: VIDEO_METADATA.completionProgress,
      }
    );

    chatLogger.info('updateMessageWithAttachments CALLED');

    // Add to library
    try {
      chatLogger.debug('📚 Adding video to library');

      // Use model name from videoTask if available
      const modelName = videoTask?.model === "payperwork-v2"
        ? VIDEO_MODEL_NAMES["sora2"] as string
        : VIDEO_MODEL_NAMES["kling"] as string;

      await addToLibrary({
        type: "video",
        url: videoUrl,
        name: fileName,
        prompt: message?.content,
        model: modelName,
        messageId: messageId,
        conversationId: currentConversationId || undefined,
        metadata: {
          duration: (videoTask?.duration || "5") + "s",
          aspectRatio: videoTask?.aspectRatio || "16:9",
        },
      });
      chatLogger.info('Video successfully added to library');
    } catch (error) {
      chatLogger.error('Failed to add video to library:', error instanceof Error ? error : undefined);
    }
  };

  const onVideoFailed = (messageId: string, error: string) => {
    const currentMessage = messages.find(m => m.id === messageId);
    if (currentMessage?.videoTask) {
      updateMessageWithAttachments(
        messageId,
        `${ERROR_MESSAGES.videoGenerationFailed}: ${error}`,
        currentMessage.attachments || [],
        { ...currentMessage.videoTask, status: "failed", error }
      );
    } else {
      updateMessage(messageId, `${ERROR_MESSAGES.videoGenerationFailed}: ${error}`);
    }
  };

  const onProgressUpdate = (messageId: string, progress: number, estimatedTimeRemaining?: number) => {
    // Update message videoTask with progress
    const currentMessage = messages.find(m => m.id === messageId);
    if (currentMessage?.videoTask) {
      updateMessageWithAttachments(
        messageId,
        currentMessage.content,
        currentMessage.attachments || [],
        {
          ...currentMessage.videoTask,
          progress,
          estimatedTimeRemaining,
        }
      );
    }
  };

  return {
    onVideoReady,
    onVideoFailed,
    onProgressUpdate,
  };
}
