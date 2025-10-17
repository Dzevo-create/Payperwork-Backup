"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { Message } from "@/types/chat";
import { C1Renderer } from "@/components/chat/C1Renderer";
import { chatLogger } from '@/lib/logger';

interface MessageContentProps {
  message: Message;
  isStreamingMessage: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onC1Action?: (data: { llmFriendlyMessage: string }) => void;
}

export const MessageContent = memo(function MessageContent({
  message,
  isStreamingMessage,
  onEditMessage,
  onC1Action,
}: MessageContentProps) {
  // Image generation placeholder
  if (message.generationType === "image" && isStreamingMessage) {
    // This will be handled by parent component (ImageGenerationPlaceholder)
    return null;
  }

  // Loading indicator when waiting for response (text chat)
  if (
    message.role === "assistant" &&
    !message.content &&
    isStreamingMessage
  ) {
    return (
      <div className="flex items-center gap-2 text-pw-black/60">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Denkt nach...</span>
      </div>
    );
  }

  if (message.content) {
    // SuperChat Mode: Render with C1Component for interactive UI
    // Check for wasGeneratedWithC1 flag (this is the correct flag from Supabase)
    if (message.role === "assistant" && message.wasGeneratedWithC1) {
      chatLogger.debug('Rendering C1 message:', {
        id: message.id,
        wasGeneratedWithC1: message.wasGeneratedWithC1,
        isC1Streaming: message.isC1Streaming,
        isStreamingMessage,
        contentPreview: message.content.substring(0, 100),
      });
      return (
        <C1Renderer
          c1Response={message.content}
          isStreaming={message.isC1Streaming || isStreamingMessage}
          onAction={onC1Action}
        />
      );
    }

    // Standard Chat: Regular markdown rendering
    return (
      <div
        className="text-sm leading-relaxed prose prose-sm max-w-none
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
        prose-blockquote:border-l-4 prose-blockquote:border-pw-accent/30 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-pw-black/70 prose-blockquote:my-4"
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="whitespace-pre-wrap mb-4 last:mb-0">{children}</p>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-semibold mt-6 mb-3 first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold mt-4 mb-2">{children}</h3>
            ),
            ul: ({ children }) => (
              <ul className="space-y-2 my-4">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="space-y-2 my-4">{children}</ol>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    );
  }

  return null;
});
