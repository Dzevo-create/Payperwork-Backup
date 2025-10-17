import { useRef, useEffect } from "react";
import { VideoSettingsType } from "@/components/chat/Chat/VideoSettings";
import { VideoModel } from "@/components/chat/Chat/ChatHeader";
import { Message, Attachment } from "@/types/chat";
import { addCameraMovementToPrompt } from "@/utils/cameraPrompts";
import { getErrorMessage } from "@/utils/errorHandler";
import { videoCache } from "@/lib/utils/videoCache";
import { chatLogger } from '@/lib/logger';

/**
 * Interface for the hook's return value
 */
export interface UseVideoGenerationReturn {
  handleVideoGeneration: (params: VideoGenerationParams) => Promise<void>;
}

/**
 * Parameters for video generation
 */
export interface VideoGenerationParams {
  content: string;
  attachments?: Attachment[];
  contextImages?: Attachment[];
  videoSettings: VideoSettingsType;
  selectedVideoModel: VideoModel;
  assistantMessageId: string;
  currentConversationId: string | null;
  // Callbacks
  updateMessageWithAttachments: (
    messageId: string,
    content: string,
    attachments: Attachment[],
    videoTask?: Message["videoTask"]
  ) => void;
  addToQueue: (
    messageId: string,
    taskId: string,
    model: "payperwork-v1" | "payperwork-v2",
    type: "text2video" | "image2video",
    prompt: string,
    thumbnailUrl?: string,
    estimatedDuration?: number,
    duration?: string,
    aspectRatio?: string
  ) => void;
  updateQueueTaskId: (messageId: string, newTaskId: string) => void;
  markVideoCompleted: (messageId: string, videoUrl: string) => void;
  removeFromQueue: (messageId: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: { message: string; retryable: boolean } | null) => void;
  messages: Message[];
}

/**
 * Custom Hook: Video Generation Logic
 *
 * Extrahiert aus ChatArea.tsx - Verantwortlich für:
 * - Video-Generierung über unified API (/api/generate-video)
 * - Queue Management (temp IDs, real task IDs)
 * - Progress Tracking & Placeholder Rendering
 * - Error Handling & Cleanup
 */
export function useVideoGeneration(): UseVideoGenerationReturn {
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount - prevents memory leaks
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  /**
   * Main video generation handler
   */
  const handleVideoGeneration = async (params: VideoGenerationParams): Promise<void> => {
    const {
      content,
      attachments,
      contextImages,
      videoSettings,
      selectedVideoModel,
      assistantMessageId,
      currentConversationId,
      updateMessageWithAttachments,
      addToQueue,
      updateQueueTaskId,
      markVideoCompleted,
      removeFromQueue,
      setIsGenerating,
      setError,
      messages,
    } = params;

    try {
      // Determine if we have an image (text2video vs image2video)
      const hasImageAttachment = attachments && attachments.some(att => att.type === "image");
      const hasContextImage = contextImages && contextImages.length > 0;
      const hasImage = hasImageAttachment || hasContextImage;

      // Determine model and type
      const model: "payperwork-v1" | "payperwork-v2" = selectedVideoModel === "sora2" ? "payperwork-v2" : "payperwork-v1";
      const type: "text2video" | "image2video" = hasImage ? "image2video" : "text2video";

      // Get image if present
      let imageBase64 = "";
      if (hasImageAttachment) {
        const imageAtt = attachments!.find(att => att.type === "image");
        imageBase64 = imageAtt?.base64 || "";
      } else if (hasContextImage) {
        const contextImg = contextImages[0];
        imageBase64 = contextImg?.base64 || "";
      }

      // Enhance prompt with camera movement (only for Kling AI)
      const finalPrompt = model === "payperwork-v1"
        ? addCameraMovementToPrompt(content, videoSettings.cameraMovement)
        : content;

      // Estimate duration based on video model (for queue UI)
      let estimatedDuration: number;
      if (model === "payperwork-v2") {
        // fal.ai Sora 2 is fast: ~30 seconds to 1 minute
        estimatedDuration = parseInt(videoSettings.duration) <= 4 ? 0.5 : 1;
      } else {
        // Kling AI: depends on mode and duration
        estimatedDuration = parseInt(videoSettings.duration) * (videoSettings.mode === "pro" ? 1.6 : 1.2);
      }

      // Get thumbnail (if image attached) - needed for queue
      let thumbnailUrl = undefined;
      if (hasImageAttachment) {
        const imageAtt = attachments!.find(att => att.type === "image");
        thumbnailUrl = imageAtt?.base64;
      } else if (hasContextImage) {
        thumbnailUrl = contextImages[0]?.base64;
      }

      // Generate temporary task ID for queue (will be replaced with real one)
      const tempTaskId = `temp-${Date.now()}`;

      // ADD TO QUEUE IMMEDIATELY - BEFORE API CALL!
      addToQueue(
        assistantMessageId,
        tempTaskId,
        model,
        type,
        content,
        thumbnailUrl,
        estimatedDuration,
        videoSettings.duration, // Pass actual duration setting
        videoSettings.aspectRatio // Pass actual aspect ratio setting
      );

      // Update assistant message with "generating" status and placeholder attachment
      const modelName = model === "payperwork-v2" ? "Payperwork Move v2" : "Payperwork Move v1";

      // Create initial message with videoTask metadata for placeholder rendering
      const messageWithPlaceholder: Partial<Message> = {
        id: assistantMessageId,
        role: "assistant",
        content: `⏳ Video wird generiert mit **${modelName}**...`,
        timestamp: new Date(),
        attachments: [
          {
            type: "video",
            url: "", // Empty URL indicates placeholder state
            name: "video.mp4",
          }
        ],
        videoTask: {
          taskId: tempTaskId,
          status: "processing",
          model,
          type,
          duration: videoSettings.duration,
          aspectRatio: videoSettings.aspectRatio,
          progress: 0,
          estimatedTimeRemaining: estimatedDuration * 60, // convert to seconds
          thumbnailUrl,
        },
      };

      // Update the message in store with placeholder
      updateMessageWithAttachments(
        assistantMessageId,
        messageWithPlaceholder.content!,
        messageWithPlaceholder.attachments!,
        messageWithPlaceholder.videoTask
      );

      // Create AbortController for this request
      abortControllerRef.current = new AbortController();

      // Call unified API
      const videoResponse = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          type,
          prompt: finalPrompt,
          image: imageBase64 || undefined,
          duration: videoSettings.duration,
          aspectRatio: videoSettings.aspectRatio,
          mode: videoSettings.mode, // Only used by payperwork-v1
          audioEnabled: videoSettings.audioEnabled, // Only used by payperwork-v2
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!videoResponse.ok) {
        const errorData = await videoResponse.json().catch(() => ({}));
        const errorMessage = getErrorMessage(errorData.error || { status: videoResponse.status });

        // CRITICAL: Remove from queue if initial API call fails
        chatLogger.error('Video API call failed:', {
          status: videoResponse.status,
          error: errorData,
          messageId: assistantMessageId,
          tempTaskId,
        });
        removeFromQueue(assistantMessageId);

        throw new Error(errorMessage);
      }

      const videoData = await videoResponse.json();

      chatLogger.debug('📦 Video API Response:', {
        messageId: assistantMessageId,
        tempTaskId,
        task_id: videoData.task_id,
        status: videoData.status,
        hasVideos: !!videoData.videos,
      });

      // API returns {task_id, status: "processing"} for Kling or {status: "succeed", videos: [...]} for fal.ai
      if (videoData.task_id) {
        const isImmediate = videoData.status === "succeed" && videoData.videos?.length > 0;

        // CRITICAL FIX: Update queue with real task ID (replace temp ID)
        // This must happen BEFORE any other updates to ensure polling works
        chatLogger.info('Updating queue task ID:', {
          messageId: assistantMessageId,
          from: tempTaskId,
          to: videoData.task_id,
        });
        updateQueueTaskId(assistantMessageId, videoData.task_id);

        // Update message videoTask with real task ID
        const currentMessage = messages.find(m => m.id === assistantMessageId);
        if (currentMessage?.videoTask) {
          updateMessageWithAttachments(
            assistantMessageId,
            currentMessage.content,
            currentMessage.attachments || [],
            {
              ...currentMessage.videoTask,
              taskId: videoData.task_id,
            }
          );
        }

        // If fal.ai returns immediately with video, handle completion manually
        if (isImmediate) {
          const videoUrl = videoData.videos[0].url;
          const fileName = `payperwork-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.mp4`;

          chatLogger.debug('🎉 IMMEDIATE VIDEO READY (fal.ai):', {
            messageId: assistantMessageId,
            taskId: videoData.task_id,
            videoUrl,
          });

          // Cache the video for faster access
          videoCache.set({
            videoUrl,
            taskId: videoData.task_id,
            model,
            duration: videoSettings.duration,
            aspectRatio: videoSettings.aspectRatio,
          });

          // Update message with video
          updateMessageWithAttachments(
            assistantMessageId,
            "✅ Video wurde erfolgreich generiert!",
            [
              {
                type: "video",
                url: videoUrl,
                name: fileName,
              },
            ],
            {
              status: "succeed",
              taskId: videoData.task_id,
              model,
              type,
              duration: videoSettings.duration,
              aspectRatio: videoSettings.aspectRatio,
              progress: 100,
            }
          );

          // CRITICAL FIX: For immediate completions (fal.ai), mark queue item as completed
          // This prevents it from staying in "processing" state forever
          chatLogger.info('Marking queue item as completed for immediate video');
          markVideoCompleted(assistantMessageId, videoUrl);
        }
      } else {
        // CRITICAL: Remove from queue if API response doesn't contain task_id
        chatLogger.error('Unexpected API response format:', {
          response: videoData,
          messageId: assistantMessageId,
          tempTaskId,
        });
        removeFromQueue(assistantMessageId);

        throw new Error("Unexpected API response format - missing task_id");
      }

      setIsGenerating(false);
      abortControllerRef.current = null;
      setError(null);
    } catch (error) {
      setIsGenerating(false);
      abortControllerRef.current = null;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Handle abort (user cancelled)
      if (error instanceof Error && error.name === "AbortError") {
        chatLogger.debug('Video generation stopped by user');
        return;
      }

      chatLogger.error('Error calling Video API:', error);

      // Determine if error is retryable
      const isRetryable = !errorMessage.includes("API key") &&
                          !errorMessage.includes("not configured") &&
                          !errorMessage.includes("Invalid") &&
                          error instanceof Error &&
                          error.name !== "TypeError"; // Network errors are retryable

      // Set error in store
      setError({
        message: errorMessage || "Ein Fehler ist aufgetreten",
        retryable: isRetryable,
      });

      // Update assistant message with error (using existing message if available)
      const currentMessage = messages.find(m => m.id === assistantMessageId);
      if (currentMessage?.videoTask) {
        updateMessageWithAttachments(
          assistantMessageId,
          `❌ Videogenerierung fehlgeschlagen: ${errorMessage}`,
          currentMessage.attachments || [],
          {
            ...currentMessage.videoTask,
            status: "failed",
            error: errorMessage,
          }
        );
      } else {
        // Fallback if no videoTask exists
        updateMessageWithAttachments(
          assistantMessageId,
          `❌ Videogenerierung fehlgeschlagen: ${errorMessage}`,
          [],
          undefined
        );
      }
    }
  };

  return {
    handleVideoGeneration,
  };
}
