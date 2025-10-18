"use client";

import { Reply, Video, Maximize, Image as ImageIcon, FileText } from "lucide-react";
import { Message, Attachment } from "@/types/chat";
import { VideoGenerationPlaceholder } from "../VideoGenerationPlaceholder";
import { getImageGridLayout } from "@/lib/utils/messageFormatting";
import { chatLogger } from '@/lib/logger';

interface MessageAttachmentsProps {
  message: Message;
  onReplyMessage?: (message: Message, specificAttachment?: Attachment) => void;
  setLightboxImage: (data: { url: string; name: string } | null) => void;
  setLightboxVideo: (data: { url: string; name: string } | null) => void;
}

export function MessageAttachments({
  message,
  onReplyMessage,
  setLightboxImage,
  setLightboxVideo,
}: MessageAttachmentsProps) {
  if (!message.attachments || message.attachments.length === 0) {
    return null;
  }

  // Filter images from attachments
  const images = message.attachments.filter(att => att.type === "image");
  const otherAttachments = message.attachments.filter(att => att.type !== "image");

  const layout = getImageGridLayout(
    images.length,
    message.imageTask?.aspectRatio || "1:1",
    message.role === "user"
  );

  return (
    <div className="mb-3 space-y-2">
      {/* Render images with grid layout */}
      {images.length > 0 && (
        <div className={layout.containerClass}>
          {layout.customLayout === "2+1" ? (
            <>
              <div className="grid grid-cols-2 gap-2 col-span-full">
                {images.slice(0, 2).map((att, idx) => (
                  <div
                    key={idx}
                    className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group/image"
                    onClick={() => setLightboxImage({ url: att.url, name: att.name })}
                  >
                    <img
                      src={att.url}
                      alt={att.name}
                      className="rounded-lg w-full h-auto"
                    />
                    {onReplyMessage && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReplyMessage(message, att);
                        }}
                        className="absolute bottom-2 right-2 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg transition-all hover:scale-110 border border-white/40 shadow-lg z-10"
                        title="Auf dieses Bild antworten"
                      >
                        <Reply className="w-4 h-4 text-white drop-shadow-lg" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {images.slice(2).map((att, idx) => (
                <div
                  key={idx + 2}
                  className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group/image col-span-full"
                  onClick={() => setLightboxImage({ url: att.url, name: att.name })}
                >
                  <img
                    src={att.url}
                    alt={att.name}
                    className="rounded-lg w-full h-auto"
                  />
                  {onReplyMessage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReplyMessage(message, att);
                      }}
                      className="absolute bottom-2 right-2 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg transition-all hover:scale-110 border border-white/40 shadow-lg z-10"
                      title="Auf dieses Bild antworten"
                    >
                      <Reply className="w-4 h-4 text-white drop-shadow-lg" />
                    </button>
                  )}
                </div>
              ))}
            </>
          ) : (
            images.map((att, idx) => (
              <div key={idx} className={layout.imageClass}>
                <div
                  className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group/image"
                  onClick={() => setLightboxImage({ url: att.url, name: att.name })}
                >
                  <img
                    src={att.url}
                    alt={att.name}
                    className="rounded-lg w-full h-auto"
                  />
                  {/* Reply Button - Glassmorphism style */}
                  {onReplyMessage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReplyMessage(message, att);
                      }}
                      className="absolute bottom-2 right-2 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg transition-all hover:scale-110 border border-white/40 shadow-lg z-10"
                      title="Auf dieses Bild antworten"
                    >
                      <Reply className="w-4 h-4 text-white drop-shadow-lg" />
                    </button>
                  )}
                </div>
                {/* Image Info & Download Button */}
                <div className="mt-3 flex items-center justify-between gap-3 px-2">
                  <div className="flex items-center gap-2 text-xs text-pw-black/60">
                    <ImageIcon className="w-4 h-4" />
                    <span>{att.name || "image.png"}</span>
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const response = await fetch(att.url);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = att.name || "payperwork-image.png";
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (error) {
                        chatLogger.error('Download failed:', error instanceof Error ? error : undefined);
                        window.open(att.url, '_blank');
                      }
                    }}
                    className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors shadow-sm"
                    title="Download"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Render other attachments (PDF, videos, etc.) */}
      {otherAttachments.map((att, idx) => (
        <div key={`other-${idx}`}>
          {att.type === "video" ? (
            // Check if video is still generating or failed (show placeholder)
            (message.videoTask?.status === "processing" || message.videoTask?.status === "failed") && !att.url ? (
              <VideoGenerationPlaceholder
                className="max-w-3xl"
                model={message.videoTask.model}
                duration={message.videoTask.duration}
                aspectRatio={message.videoTask.aspectRatio}
                progress={message.videoTask.progress}
                estimatedTimeRemaining={message.videoTask.estimatedTimeRemaining}
                thumbnailUrl={message.videoTask.thumbnailUrl}
                status={message.videoTask.status}
                error={message.videoTask.error}
              />
            ) : (
              <div className="max-w-3xl">
                {/* Video Player with Click to Fullscreen */}
                <div
                  className="relative cursor-pointer group/video rounded-2xl overflow-hidden bg-pw-black/5"
                  onClick={() => setLightboxVideo({ url: att.url, name: att.name || "video.mp4" })}
                >
                  <video
                    src={att.url}
                    controls
                    className="w-full max-h-[600px] rounded-2xl object-contain"
                    preload="metadata"
                    poster={att.thumbnail || `${att.url}#t=0.1`}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {/* Fullscreen button overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxVideo({ url: att.url, name: att.name || "video.mp4" });
                    }}
                    className="absolute top-1 right-1 p-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg transition-all hover:scale-110 opacity-0 group-hover/video:opacity-100"
                    title="Vollbild ansehen"
                  >
                    <Maximize className="w-4 h-4 text-white" />
                  </button>
                </div>
                {/* Video Info & Download Button */}
                <div className="mt-3 flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2 text-xs text-pw-black/60">
                    <Video className="w-4 h-4" />
                    <span>{att.name || "video.mp4"}</span>
                    {att.duration && <span>• {att.duration}s</span>}
                  </div>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        // Fetch video and trigger download
                        const response = await fetch(att.url);
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = att.name || "payperwork-video.mp4";
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (error) {
                        chatLogger.error('Download failed:', error instanceof Error ? error : undefined);
                        // Fallback: try direct download
                        window.open(att.url, '_blank');
                      }
                    }}
                    className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors shadow-sm"
                    title="Download"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 bg-pw-black/5 rounded-lg">
              <FileText className="w-4 h-4 text-pw-black/60" />
              <span className="text-xs text-pw-black/70">{att.name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
