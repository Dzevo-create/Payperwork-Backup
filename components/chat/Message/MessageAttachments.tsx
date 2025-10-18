"use client";

import { memo, useMemo } from "react";
import { Loader2, FileText } from "lucide-react";
import { Message, Attachment } from "@/types/chat";
import { ImageAttachment } from "../Chat/ImageAttachment";
import { VideoAttachment } from "../Chat/VideoAttachment";
import { VideoGenerationPlaceholder } from "../VideoGenerationPlaceholder";
import { ImageGenerationPlaceholder } from "../ImageGenerationPlaceholder";
import { getImageGridLayout } from "@/lib/utils/messageFormatting";
import { chatLogger } from '@/lib/logger';

interface MessageAttachmentsProps {
  message: Message;
  isStreamingMessage: boolean;
  setLightboxImage: (data: { url: string; name: string }) => void;
  setLightboxVideo: (data: { url: string; name: string }) => void;
  onReplyMessage?: (message: Message, specificAttachment?: Attachment) => void;
}

export const MessageAttachments = memo(function MessageAttachments({
  message,
  isStreamingMessage,
  setLightboxImage,
  setLightboxVideo,
  onReplyMessage,
}: MessageAttachmentsProps) {
  // Image generation placeholder - show even without attachments
  if (message.generationType === "image" && isStreamingMessage) {
    return (
      <ImageGenerationPlaceholder
        className={
          message.imageTask?.aspectRatio === "9:16" ? "max-w-sm" : "max-w-3xl"
        }
        aspectRatio={message.imageTask?.aspectRatio || "1:1"}
        quality={message.imageTask?.quality}
        style={message.imageTask?.style}
      />
    );
  }

  if (!message.attachments || message.attachments.length === 0) {
    return null;
  }

  // Memoize filtered attachments to avoid recalculating on every render
  const images = useMemo(
    () => message.attachments?.filter((att) => att.type === "image") || [],
    [message.attachments]
  );

  const otherAttachments = useMemo(
    () => message.attachments?.filter((att) => att.type !== "image") || [],
    [message.attachments]
  );

  const renderImageAttachments = () => {
    if (images.length === 0) return null;

    const layout = getImageGridLayout(
      images.length,
      message.imageTask?.aspectRatio || "1:1",
      message.role === "user"
    );

    if (layout.customLayout === "2+1") {
      return (
        <div className={layout.containerClass}>
          <div className="grid grid-cols-2 gap-2 col-span-full">
            {images.slice(0, 2).map((att, idx) => (
              <ImageAttachment
                key={idx}
                attachment={att}
                message={message}
                onImageClick={setLightboxImage}
                onReplyMessage={onReplyMessage}
              />
            ))}
          </div>
          {images.slice(2).map((att, idx) => (
            <div key={idx + 2} className="col-span-full">
              <ImageAttachment
                attachment={att}
                message={message}
                onImageClick={setLightboxImage}
                onReplyMessage={onReplyMessage}
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className={layout.containerClass}>
        {images.map((att, idx) => (
          <div key={idx} className={layout.imageClass}>
            <ImageAttachment
              attachment={att}
              message={message}
              onImageClick={setLightboxImage}
              onReplyMessage={onReplyMessage}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderOtherAttachments = () => {
    if (otherAttachments.length === 0) return null;

    // Debug log for video attachments
    const videoAttachments = otherAttachments.filter((att) => att.type === "video");
    if (videoAttachments.length > 0) {
      chatLogger.debug('Video attachments found', {
        messageId: message.id,
        videoCount: videoAttachments.length,
        attachments: videoAttachments.map(att => ({
          type: att.type,
          url: att.url,
          name: att.name,
        })),
        videoTaskStatus: message.videoTask?.status,
      });
    }

    return (
      <>
        {otherAttachments.map((att, idx) => (
          <div key={`other-${idx}`}>
            {att.type === "video" ? (
              // Show video if it has a URL (works for both old and new videos)
              // Show placeholder only if still processing or failed without URL
              att.url ? (
                <VideoAttachment
                  attachment={att}
                  message={message}
                  onVideoClick={(url, name) => setLightboxVideo({ url, name })}
                />
              ) : (
                <VideoGenerationPlaceholder
                  className="max-w-3xl"
                  model={message.videoTask?.model || "payperwork-v1"}
                  duration={message.videoTask?.duration || "5"}
                  aspectRatio={message.videoTask?.aspectRatio || "16:9"}
                  progress={message.videoTask?.progress}
                  estimatedTimeRemaining={message.videoTask?.estimatedTimeRemaining}
                  thumbnailUrl={message.videoTask?.thumbnailUrl}
                  status={message.videoTask?.status || "processing"}
                  error={message.videoTask?.error}
                />
              )
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-pw-black/5 rounded-lg">
                <FileText className="w-4 h-4 text-pw-black/60" />
                <span className="text-xs text-pw-black/70">{att.name}</span>
              </div>
            )}
          </div>
        ))}
      </>
    );
  };

  // Video generation status
  const renderVideoGenerationStatus = () => {
    if (!message.videoTask) return null;

    return (
      <div className="mt-3 p-3 bg-pw-black/5 rounded-lg">
        {message.videoTask.status === "processing" && (
          <div className="flex items-center gap-2 text-sm text-pw-black/70">
            <Loader2 className="w-4 h-4 animate-spin text-pw-accent" />
            <span>Video wird generiert... (dauert ca. 2-5 Min)</span>
          </div>
        )}
        {message.videoTask.status === "failed" && (
          <div className="text-sm text-red-600">
            Fehler bei der Videogenerierung: {message.videoTask.error}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="my-2">
      {renderImageAttachments()}
      {renderOtherAttachments()}
      {renderVideoGenerationStatus()}
    </div>
  );
});
