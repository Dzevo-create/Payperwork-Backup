import { useState, useCallback, useRef, useEffect } from "react";
import { Message, Attachment } from "@/types/chat";
import { ImageSettingsType } from "@/components/chat/Chat/ImageSettings";
import { chatLogger } from '@/lib/logger';

export interface UseReplyMessageReturn {
  replyTo: Message | null;
  setReplyTo: React.Dispatch<React.SetStateAction<Message | null>>;
  handleReplyMessage: (message: Message, specificAttachment?: Attachment) => void;
  clearReply: () => void;
}

export interface UseReplyMessageOptions {
  onModeChange: (mode: "chat" | "image" | "video") => void;
  onImageSettingsChange: (settings: ImageSettingsType | ((prev: ImageSettingsType) => ImageSettingsType)) => void;
}

/**
 * Custom hook for managing reply message logic in the chat area
 * Handles:
 * - Reply state management
 * - Auto-switching mode based on message type
 * - Auto-detecting aspect ratio for image replies
 */
export function useReplyMessage({
  onModeChange,
  onImageSettingsChange,
}: UseReplyMessageOptions): UseReplyMessageReturn {
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const imageLoadersRef = useRef<Set<HTMLImageElement>>(new Set());

  useEffect(() => {
    return () => {
      // Cleanup all pending image loaders
      imageLoadersRef.current.forEach(img => {
        img.onload = null;
        img.onerror = null;
        img.src = '';
      });
      imageLoadersRef.current.clear();
    };
  }, []);

  /**
   * Handle replying to a message
   * Automatically switches mode based on message type and detects aspect ratio for images
   */
  const handleReplyMessage = useCallback(
    (message: Message, specificAttachment?: Attachment) => {
      // If a specific attachment is provided, create a modified message with only that attachment
      const replyMessage: Message = specificAttachment
        ? { ...message, attachments: [specificAttachment] }
        : message;

      setReplyTo(replyMessage);

      // Auto-switch mode based on the message's generation type
      if (message.generationType === "image" || replyMessage.generationType === "image") {
        onModeChange("image");

        // Auto-adjust aspect ratio based on reply image
        // Use specific attachment if provided, otherwise find first image
        const imageAttachment = specificAttachment?.type === "image"
          ? specificAttachment
          : replyMessage.attachments?.find(att => att.type === "image");

        if (imageAttachment && imageAttachment.url) {
          // Load image to detect aspect ratio
          const img = new Image();
          imageLoadersRef.current.add(img);

          img.onload = () => {
            // Remove from tracking set
            imageLoadersRef.current.delete(img);

            const width = img.naturalWidth;
            const height = img.naturalHeight;
            const ratio = width / height;

            let detectedRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:2" | "21:9" = "16:9";

            // Detect ratio with tolerance
            if (Math.abs(ratio - 1) < 0.1) detectedRatio = "1:1"; // Square
            else if (Math.abs(ratio - 16/9) < 0.1) detectedRatio = "16:9"; // Landscape
            else if (Math.abs(ratio - 9/16) < 0.1) detectedRatio = "9:16"; // Portrait
            else if (Math.abs(ratio - 4/3) < 0.1) detectedRatio = "4:3"; // Classic
            else if (Math.abs(ratio - 3/2) < 0.1) detectedRatio = "3:2"; // DSLR
            else if (Math.abs(ratio - 21/9) < 0.1) detectedRatio = "21:9"; // Ultrawide
            else if (ratio > 1.5) detectedRatio = "16:9"; // Default landscape
            else if (ratio < 0.7) detectedRatio = "9:16"; // Default portrait

            chatLogger.debug('Auto-detected aspect ratio', {
              width,
              height,
              ratio,
              detectedRatio
            });

            onImageSettingsChange(prev => ({
              ...prev,
              aspectRatio: detectedRatio
            }));
          };

          img.onerror = () => {
            // Remove from tracking set on error
            imageLoadersRef.current.delete(img);
            chatLogger.error('Failed to load image for aspect ratio detection');
          };

          img.src = imageAttachment.url;
        }
      } else if (message.generationType === "video") {
        onModeChange("video");
      } else if (message.attachments && message.attachments.length > 0) {
        // Fallback: Check attachments if no generationType (for old messages)
        const hasImage = message.attachments.some(att => att.type === "image");
        const hasVideo = message.attachments.some(att => att.type === "video");

        if (hasImage) {
          onModeChange("image");

          // Auto-adjust aspect ratio for fallback case too
          const imageAttachment = message.attachments.find(att => att.type === "image");
          if (imageAttachment && imageAttachment.url) {
            const img = new Image();
            imageLoadersRef.current.add(img);

            img.onload = () => {
              // Remove from tracking set
              imageLoadersRef.current.delete(img);

              const width = img.naturalWidth;
              const height = img.naturalHeight;
              const ratio = width / height;

              let detectedRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:2" | "21:9" = "16:9";

              if (Math.abs(ratio - 1) < 0.1) detectedRatio = "1:1";
              else if (Math.abs(ratio - 16/9) < 0.1) detectedRatio = "16:9";
              else if (Math.abs(ratio - 9/16) < 0.1) detectedRatio = "9:16";
              else if (Math.abs(ratio - 4/3) < 0.1) detectedRatio = "4:3";
              else if (Math.abs(ratio - 3/2) < 0.1) detectedRatio = "3:2";
              else if (Math.abs(ratio - 21/9) < 0.1) detectedRatio = "21:9";
              else if (ratio > 1.5) detectedRatio = "16:9";
              else if (ratio < 0.7) detectedRatio = "9:16";

              chatLogger.debug('Auto-detected aspect ratio (fallback)', {
                width,
                height,
                ratio,
                detectedRatio
              });

              onImageSettingsChange(prev => ({
                ...prev,
                aspectRatio: detectedRatio
              }));
            };

            img.onerror = () => {
              // Remove from tracking set on error
              imageLoadersRef.current.delete(img);
              chatLogger.error('Failed to load image for aspect ratio detection (fallback)');
            };

            img.src = imageAttachment.url;
          }
        } else if (hasVideo) {
          onModeChange("video");
        } else {
          onModeChange("chat");
        }
      } else {
        onModeChange("chat");
      }
    },
    [onModeChange, onImageSettingsChange]
  );

  /**
   * Clear the current reply state
   */
  const clearReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  return {
    replyTo,
    setReplyTo,
    handleReplyMessage,
    clearReply,
  };
}
