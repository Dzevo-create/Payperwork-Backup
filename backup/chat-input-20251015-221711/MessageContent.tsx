"use client";

import ReactMarkdown from "react-markdown";
import { Loader2, X, Send } from "lucide-react";
import { Message } from "@/types/chat";
import { ImageGenerationPlaceholder } from "../ImageGenerationPlaceholder";

interface MessageContentProps {
  message: Message;
  isStreamingMessage: boolean;
  isEditing: boolean;
  editContent: string;
  onEditChange: (content: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

export function MessageContent({
  message,
  isStreamingMessage,
  isEditing,
  editContent,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onEditMessage,
}: MessageContentProps) {
  // Edit Mode - Full width like chat input
  if (isEditing) {
    return (
      <div className="w-full space-y-1.5">
        <textarea
          value={editContent}
          onChange={(e) => onEditChange(e.target.value)}
          className="w-full min-h-[50px] max-h-[120px] p-3 bg-transparent border-0 rounded-lg text-sm resize-none focus:outline-none placeholder:text-pw-black/30"
          autoFocus
        />
        <div className="flex gap-1 justify-end">
          <button
            onClick={onCancelEdit}
            className="p-1 text-pw-black/40 hover:text-pw-black/60 hover:bg-pw-black/5 rounded transition-colors"
            title="Abbrechen"
          >
            <X className="w-3 h-3" />
          </button>
          <button
            onClick={onSaveEdit}
            className="p-1 text-pw-black/40 hover:text-pw-black/60 hover:bg-pw-black/5 rounded transition-colors"
            title="Senden"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // Image generation placeholder
  if (message.generationType === "image" && isStreamingMessage) {
    return (
      <ImageGenerationPlaceholder
        className={message.imageTask?.aspectRatio === "9:16" ? "max-w-sm" : "max-w-3xl"}
        aspectRatio={message.imageTask?.aspectRatio || "1:1"}
        quality={message.imageTask?.quality}
        style={message.imageTask?.style}
      />
    );
  }

  // Loading indicator when waiting for response (text chat)
  if (message.role === "assistant" && !message.content && isStreamingMessage) {
    return (
      <div className="flex items-center gap-2 text-pw-black/60">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Denkt nach...</span>
      </div>
    );
  }

  // If no content, return null
  if (!message.content) {
    return null;
  }

  // Standard Chat: Regular markdown rendering
  return (
    <div className="text-sm leading-relaxed prose prose-sm max-w-none
      prose-headings:font-semibold prose-headings:text-pw-black prose-headings:mt-6 prose-headings:mb-3
      prose-h1:text-xl prose-h2:text-base prose-h3:text-sm
      prose-p:text-pw-black prose-p:my-3 prose-p:leading-relaxed
      prose-strong:font-semibold prose-strong:text-pw-black
      prose-em:italic prose-em:text-pw-black
      prose-code:bg-pw-black/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-pw-black prose-code:font-mono prose-code:text-xs
      prose-pre:bg-pw-black/5 prose-pre:text-pw-black prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4
      prose-ul:my-4 prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-2
      prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-5 prose-ol:space-y-2
      prose-li:my-1 prose-li:leading-relaxed
      prose-a:text-pw-accent prose-a:underline prose-a:font-medium hover:prose-a:text-pw-accent/80
      prose-blockquote:border-l-4 prose-blockquote:border-pw-accent/30 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-pw-black/70 prose-blockquote:my-4">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="whitespace-pre-wrap mb-4 last:mb-0">{children}</p>,
          h2: ({ children }) => <h2 className="text-base font-semibold mt-6 mb-3 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mt-4 mb-2">{children}</h3>,
          ul: ({ children }) => <ul className="space-y-2 my-4">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-2 my-4">{children}</ol>,
        }}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  );
}
