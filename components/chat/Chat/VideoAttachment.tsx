"use client";

import { Maximize, Video } from "lucide-react";
import { Attachment, Message } from "@/types/chat";
import { chatLogger } from '@/lib/logger';

interface VideoAttachmentProps {
  attachment: Attachment;
  message: Message;
  onVideoClick: (url: string, name: string) => void;
}

export function VideoAttachment({
  attachment,
  message: _message,
  onVideoClick,
}: VideoAttachmentProps) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.name || "payperwork-video.mp4";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      chatLogger.error('Download failed:', error instanceof Error ? error : undefined);
      window.open(attachment.url, "_blank");
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Video Player with Click to Fullscreen */}
      <div
        className="relative cursor-pointer group/video rounded-2xl overflow-hidden bg-pw-black/5"
        onClick={() => onVideoClick(attachment.url, attachment.name || "video.mp4")}
      >
        <video
          src={attachment.url}
          controls
          className="w-full max-h-[600px] rounded-2xl object-contain [&::-webkit-media-controls-panel]:!opacity-100"
          style={{
            backgroundColor: 'transparent',
            objectFit: 'contain'
          }}
          preload="auto"
          playsInline
          onClick={(e) => e.stopPropagation()}
          onLoadedData={(e) => {
            // Ensure first frame is visible when video loads
            const video = e.currentTarget;
            if (video.paused && video.currentTime === 0) {
              video.currentTime = 0.1;
            }
          }}
          onSuspend={(e) => {
            // Prevent video from hiding on suspend
            const video = e.currentTarget;
            video.style.visibility = 'visible';
            video.style.opacity = '1';
          }}
        />
        {/* Fullscreen button overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVideoClick(attachment.url, attachment.name || "video.mp4");
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
          <span>{attachment.name || "video.mp4"}</span>
          {attachment.duration && <span>• {attachment.duration}s</span>}
        </div>
        <button
          onClick={handleDownload}
          className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors shadow-sm"
          title="Download"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
