/**
 * Custom Hook for Image Generation
 *
 * Extrahiert aus ChatArea.tsx - Handles complete image generation flow:
 * - API calls to /api/generate-image
 * - Reference images extraction and base64 conversion
 * - Retry logic with exponential backoff
 * - Progress tracking with attempt counters
 * - Supabase image upload
 * - Library integration
 * - Error handling
 */

import { useRef } from "react";
import { ImageSettingsType } from "@/components/chat/Chat/ImageSettings";
import { Attachment, Message } from "@/types/chat";
import { chatLogger } from '@/lib/logger';

interface UseImageGenerationParams {
  imageSettings: ImageSettingsType;
  currentConversationId: string | null;
  messages: Message[];
  updateMessageWithAttachments: (
    messageId: string,
    content: string,
    attachments: Attachment[],
    videoTask?: Message["videoTask"],
    generationAttempt?: number
  ) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: { message: string; retryable?: boolean } | null) => void;
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

interface GenerateImageParams {
  content: string;
  assistantMessageId: string;
  attachments?: Attachment[];
  contextImages?: Attachment[];
  abortSignal: AbortSignal;
}

export function useImageGeneration({
  imageSettings,
  currentConversationId,
  messages,
  updateMessageWithAttachments,
  setIsGenerating,
  setError,
  addToLibrary,
}: UseImageGenerationParams) {

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Generates images using Nano Banana API with retry logic
   */
  const generateImage = async ({
    content,
    assistantMessageId,
    attachments,
    contextImages,
    abortSignal,
  }: GenerateImageParams): Promise<void> => {
    // Extract reference images from attachments (for editing/character consistency)
    let referenceImages = attachments
      ?.filter((att) => att.type === "image" && att.base64)
      .map((att) => ({
        data: att.base64!.split(",")[1] ?? '', // Remove data:image/...;base64, prefix
        mimeType: att.base64!.split(";")[0]?.split(":")[1] ?? 'image/jpeg',
      })) || [];

    // Also include context images from reply (if any)
    if (contextImages && contextImages.length > 0) {
      const contextReferenceImages = contextImages
        .filter((att) => att.type === "image" && att.base64)
        .map((att) => ({
          data: att.base64!.split(",")[1] ?? '', // Remove data:image/...;base64, prefix
          mimeType: att.base64!.split(";")[0]?.split(":")[1] ?? 'image/jpeg',
        }));
      referenceImages = [...referenceImages, ...contextReferenceImages];
    }

    // Debug log to verify referenceImages are correct
    chatLogger.debug("referenceImages for Gemini", {
      images: referenceImages.map(img => ({
        data_length: img.data?.length || 0,
        mimeType: img.mimeType,
        data_preview: img.data?.substring(0, 50) + "...",
      }))
    });

    // Retry configuration for frontend
    const maxRetries = 2; // API already retries 4 times, so 2 frontend retries = 15 total attempts max
    let lastError: (Error & { status?: number; retryable?: boolean }) | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Update attempt counter for placeholder
        const currentMessage = messages.find(m => m.id === assistantMessageId);
        if (currentMessage) {
          updateMessageWithAttachments(
            assistantMessageId,
            currentMessage.content,
            currentMessage.attachments || [],
            undefined,
            attempt + 1
          );
        }

        // Wait before retry (exponential backoff)
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
        }

        const imageResponse = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: content,
            referenceImages: referenceImages,
            settings: imageSettings, // Include preset settings (format, style, lighting, quality)
          }),
          signal: abortSignal,
        });

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json().catch(() => ({}));
          // Log debug info if available
          if (errorData.debug) {
            chatLogger.error('Nano Banana Debug Info:', errorData.debug);
          }

          // Check if error is retryable
          const isRetryable = errorData.retryable || imageResponse.status >= 500;
          const error = new Error(errorData.error || "Bildgenerierung fehlgeschlagen") as Error & {
            status: number;
            retryable: boolean;
          };
          error.status = imageResponse.status;
          error.retryable = isRetryable;

          throw error;
        }

        // Success - break out of retry loop
        lastError = null;
        const imageData = await imageResponse.json();

        // Handle single or multiple images
        const imagesToProcess = imageData.images || [imageData.image];
        const imageUrls: string[] = [];

        for (let i = 0; i < imagesToProcess.length; i++) {
          const img = imagesToProcess[i];

          // Generate filename with payperwork prefix and timestamp
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0] ?? 'unknown'; // YYYY-MM-DD
          const timeStr = now.toTimeString().split(' ')[0]?.replace(/:/g, '-') ?? '00-00-00'; // HH-MM-SS
          const fileName = `payperwork-${dateStr}-${timeStr}-${i + 1}.png`;

          // Upload to Supabase to get permanent URL (instead of localStorage base64)
          const uploadResponse = await fetch("/api/upload-chat-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64Data: img.data,
              fileName: fileName,
              mimeType: img.mimeType,
            }),
          });

          // Use let with proper scoping instead of var inside if/else blocks
          let imageUrl: string;
          if (!uploadResponse.ok) {
            chatLogger.error(`Failed to upload image ${i + 1} to Supabase, using base64 fallback`);
            // Fallback to base64 if upload fails
            imageUrl = `data:${img.mimeType};base64,${img.data}`;
          } else {
            const uploadData = await uploadResponse.json();
            imageUrl = uploadData.url; // Supabase public URL
            chatLogger.info(`Image ${i + 1} uploaded to Supabase`, { url: uploadData.url });
          }

          imageUrls.push(imageUrl);
        }

        chatLogger.debug(`Final imageUrls before updateMessageWithAttachments (${imageUrls.length} images)`, {
          imageCount: imageUrls.length,
          urls: imageUrls.map((url, idx) => ({ index: idx, url: url.substring(0, 50) + '...' }))
        });

        // Update assistant message with generated images (multiple attachments)
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0] ?? 'unknown';
        const timeStr = now.toTimeString().split(' ')[0]?.replace(/:/g, '-') ?? '00-00-00';

        updateMessageWithAttachments(
          assistantMessageId,
          "",
          imageUrls.map((url, index) => ({
            type: "image" as const,
            url: url,
            name: `payperwork-${dateStr}-${timeStr}-${index + 1}.png`,
          }))
        );

        // Add all images to library
        for (let i = 0; i < imageUrls.length; i++) {
          try {
            const imgUrl = imageUrls[i];
            if (!imgUrl) continue;

            const imgName = `payperwork-${dateStr}-${timeStr}-${i + 1}.png`;

            chatLogger.debug(`Adding image ${i + 1} to library`, {
              type: "image",
              url: imgUrl,
              name: imgName,
              prompt: content,
              model: "Payperwork Image",
              messageId: assistantMessageId,
              conversationId: currentConversationId ?? undefined,
            });

            await addToLibrary({
              type: "image",
              url: imgUrl,
              name: imgName,
              prompt: content,
              model: "Payperwork Image",
              messageId: assistantMessageId,
              conversationId: currentConversationId ?? undefined,
            });
            chatLogger.info(`Image ${i + 1} successfully added to library`);
          } catch (error) {
            chatLogger.error(`Failed to add image ${i + 1} to library`, error instanceof Error ? error : undefined);
          }
        }

        setIsGenerating(false);
        abortControllerRef.current = null;
        setError(null);
        return;
      } catch (error) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        lastError = typedError as Error & { status?: number; retryable?: boolean };

        // Don't retry if user cancelled
        if (typedError.name === "AbortError") {
          throw typedError;
        }

        // Don't retry if error is not retryable
        if ("retryable" in typedError && typedError.retryable === false ||
            "status" in typedError && (typedError as Error & { status: number }).status === 429) {
          throw typedError;
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw typedError;
        }

        // Log retry attempt
        chatLogger.info(`Retrying image generation (attempt ${attempt + 1}/${maxRetries})`, {
          error: typedError.message,
          status: "status" in typedError ? (typedError as Error & { status: number }).status : undefined,
        });
      }
    }

    // If we get here, all retries failed
    if (lastError) {
      throw lastError;
    }
  };

  return {
    generateImage,
    abortControllerRef,
  };
}
