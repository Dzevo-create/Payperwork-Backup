"use client";

import { Reply, Image as ImageIcon } from "lucide-react";
import { Attachment, Message } from "@/types/chat";
import { chatLogger } from '@/lib/logger';

interface ImageAttachmentProps {
  attachment: Attachment;
  message: Message;
  onImageClick: (data: { url: string; name: string }) => void;
  onReplyMessage?: (message: Message, attachment: Attachment) => void;
}

export function ImageAttachment({
  attachment,
  message,
  onImageClick,
  onReplyMessage,
}: ImageAttachmentProps) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.name || "payperwork-image.png";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      chatLogger.error('Download failed:', error);
      window.open(attachment.url, "_blank");
    }
  };

  return (
    <div>
      <div
        className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group/image"
        onClick={() => onImageClick({ url: attachment.url, name: attachment.name })}
      >
        <img
          src={attachment.url}
          alt={attachment.name}
          className="rounded-lg w-full h-auto"
        />
        {/* Reply Button - Glassmorphism style */}
        {onReplyMessage && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReplyMessage(message, attachment);
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
          <span>{attachment.name || "image.png"}</span>
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
