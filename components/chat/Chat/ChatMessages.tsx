"use client";

import { useEffect, useRef, memo } from "react";
import { Message, Attachment } from "@/types/chat";
import { ImageLightbox } from "../ImageLightbox";
import { VideoLightbox } from "../VideoLightbox";
import { MessageBubble } from "./MessageBubble";
import { EmptyState } from "./EmptyState";
import { useMessageActions } from "@/hooks/chat/useMessageActions";
import { useMessageLightbox } from "@/hooks/chat/useMessageLightbox";

interface ChatMessagesProps {
  messages: Message[];
  isGenerating?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onReplyMessage?: (message: Message, specificAttachment?: Attachment) => void;
  onC1Action?: (data: { llmFriendlyMessage: string }) => void;
}

export const ChatMessages = memo(function ChatMessages({
  messages,
  isGenerating,
  onEditMessage,
  onReplyMessage,
  onC1Action,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef(messages.length);
  const hasInitialScrolledRef = useRef(false);
  const lastConversationIdRef = useRef<string | null>(null);

  // Custom hooks for state management
  const {
    copiedId,
    editingId,
    editContent,
    setEditContent,
    handleCopy,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit
  } = useMessageActions(onEditMessage);

  const {
    lightboxImage,
    setLightboxImage,
    lightboxVideo,
    setLightboxVideo
  } = useMessageLightbox();

  // Detect conversation change (to reset scroll state)
  useEffect(() => {
    const currentConvId = messages.length > 0 ? messages[0]?.id?.split('-')[0] : null;

    if (currentConvId !== lastConversationIdRef.current) {
      console.log('🔄 [ChatMessages] Conversation changed, resetting scroll state');
      lastConversationIdRef.current = currentConvId;
      hasInitialScrolledRef.current = false;
      previousMessagesLengthRef.current = 0;
    }
  }, [messages]);

  // Initial scroll to bottom when conversation loads
  useEffect(() => {
    if (messages.length > 0 && !hasInitialScrolledRef.current) {
      console.log('📍 [ChatMessages] Initial scroll to bottom');
      hasInitialScrolledRef.current = true;
      // Scroll immediately to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }, 0);
    }
  }, [messages.length]);

  // Smart auto-scroll: scroll to bottom on new messages AND during streaming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Skip if this is the first render (handled by initial scroll effect above)
    if (!hasInitialScrolledRef.current) return;

    // Check if user is near bottom (within 100px)
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 100;

    // Always scroll on new message OR if user is near bottom during streaming
    const shouldScroll =
      messages.length > previousMessagesLengthRef.current || // New message
      (isGenerating && isNearBottom); // Streaming and user is near bottom

    if (shouldScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    previousMessagesLengthRef.current = messages.length;
  }, [messages, isGenerating]);

  // Safety check: Ensure messages is an array
  if (!Array.isArray(messages)) {
    console.error("⚠️ messages is not an array:", messages);
    console.error("Attempting to recover by treating as empty array...");
    return <EmptyState />;
  }

  // Empty state
  if (messages.length === 0) {
    return <EmptyState />;
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isStreamingMessage = isLastMessage && message.role === "assistant" && isGenerating;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isLastMessage={isLastMessage}
              isGenerating={isStreamingMessage}
              editingId={editingId}
              editContent={editContent}
              copiedId={copiedId}
              onEdit={handleEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onCopy={handleCopy}
              onEditMessage={onEditMessage}
              onReplyMessage={onReplyMessage}
              setEditContent={setEditContent}
              setLightboxImage={setLightboxImage}
              setLightboxVideo={setLightboxVideo}
              onC1Action={onC1Action}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage.url}
          imageName={lightboxImage.name}
          onClose={() => setLightboxImage(null)}
        />
      )}

      {/* Video Lightbox */}
      {lightboxVideo && (
        <VideoLightbox
          videoUrl={lightboxVideo.url}
          videoName={lightboxVideo.name}
          onClose={() => setLightboxVideo(null)}
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Optimized memo comparison
  const prevLastMsg = prevProps.messages[prevProps.messages.length - 1];
  const nextLastMsg = nextProps.messages[nextProps.messages.length - 1];

  // Re-render if message length changed
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }

  // Re-render if isGenerating status changed
  if (prevProps.isGenerating !== nextProps.isGenerating) {
    return false;
  }

  // Re-render if last message ID changed
  if (prevLastMsg?.id !== nextLastMsg?.id) {
    return false;
  }

  // Re-render if last message content changed
  if (prevLastMsg?.content !== nextLastMsg?.content) {
    return false;
  }

  // Re-render if attachments changed
  const prevAttachments = prevLastMsg?.attachments || [];
  const nextAttachments = nextLastMsg?.attachments || [];
  if (prevAttachments.length !== nextAttachments.length) {
    return false;
  }

  // Check if any attachment URLs changed
  for (let i = 0; i < prevAttachments.length; i++) {
    if (prevAttachments[i]?.url !== nextAttachments[i]?.url) {
      return false;
    }
  }

  // Re-render if videoTask status changed
  if (prevLastMsg?.videoTask?.status !== nextLastMsg?.videoTask?.status) {
    return false;
  }

  // Nothing changed, skip re-render
  return true;
});
