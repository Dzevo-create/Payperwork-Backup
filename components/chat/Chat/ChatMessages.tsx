"use client";

import { useEffect, useRef, useState, memo } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { FileText, Loader2, Copy, Check, Edit2, X, Send, Reply, Video, Maximize, Image as ImageIcon } from "lucide-react";
import { Message, Attachment } from "@/types/chat";
import { ImageLightbox } from "../ImageLightbox";
import { VideoLightbox } from "../VideoLightbox";
import { VideoGenerationPlaceholder } from "../VideoGenerationPlaceholder";
import { ImageGenerationPlaceholder } from "../ImageGenerationPlaceholder";

// Dynamic import for C1 components (only loaded when Super Chat is enabled)
const C1Renderer = dynamic(() => import("../C1Renderer").then(m => m.C1Renderer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2 text-pw-black/60">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Loading interactive components...</span>
    </div>
  ),
});

interface ChatMessagesProps {
  messages: Message[];
  isGenerating?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onReplyMessage?: (message: Message, specificAttachment?: Attachment) => void;
  isSuperChatEnabled?: boolean;
}

export const ChatMessages = memo(function ChatMessages({ messages, isGenerating, onEditMessage, onReplyMessage, isSuperChatEnabled }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [lightboxVideo, setLightboxVideo] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCopy = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (messageId: string, currentContent: string) => {
    setEditingId(messageId);
    setEditContent(currentContent);
  };

  const handleSaveEdit = (messageId: string) => {
    if (editContent.trim() && onEditMessage) {
      onEditMessage(messageId, editContent);
      setEditingId(null);
      setEditContent("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  // Safety check: Ensure messages is an array
  if (!Array.isArray(messages)) {
    console.error("⚠️ messages is not an array:", messages);
    console.error("Attempting to recover by treating as empty array...");

    // DON'T reload page - just show empty state and let the app recover
    // The chatStore will auto-fix this on next rehydration
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-pw-black mb-3">
            Wie kann ich helfen?
          </h2>
          <p className="text-sm text-pw-black/60">
            Starten Sie eine neue Konversation, indem Sie eine Nachricht unten eingeben.
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-pw-black mb-3">
            Wie kann ich helfen?
          </h2>
          <p className="text-sm text-pw-black/60">
            Starten Sie eine neue Konversation, indem Sie eine Nachricht unten eingeben.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isStreamingMessage = isLastMessage && message.role === "assistant" && isGenerating;

          return (
          <div
            key={message.id}
            id={`message-${message.id}`}
            className={`group flex flex-col ${
              message.role === "user" ? "items-end pr-12 sm:pr-16 md:pr-24 lg:pr-32" : "items-start pl-12 sm:pl-16 md:pl-24 lg:pl-32"
            }`}
          >
            {/* Timestamp */}
            <div className={`text-[10px] text-pw-black/40 mb-1 px-1 ${
              message.role === "user" ? "text-right" : "text-left"
            }`}>
              {new Date(message.timestamp || Date.now()).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

            {/* Message Bubble */}
            <div
              className={`py-2.5 sm:py-3 rounded-2xl ${
                message.role === "user"
                  ? editingId === message.id
                    ? "w-full max-w-3xl px-3 sm:px-4 bg-white/20 backdrop-blur-xl border border-white/10 text-pw-black shadow-lg"
                    : "inline-block max-w-[85%] md:max-w-[80%] px-3 sm:px-4 bg-white/90 border border-pw-black/10 text-pw-black shadow-sm"
                  : "bg-transparent text-pw-black"
              }`}
            >
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {(() => {
                    // Filter images from attachments
                    const images = message.attachments.filter(att => att.type === "image");
                    const otherAttachments = message.attachments.filter(att => att.type !== "image");

                    // Helper function to get grid layout classes
                    const getImageGridLayout = () => {
                      const numImages = images.length;
                      const aspectRatio = message.imageTask?.aspectRatio || "1:1";
                      const isUserMessage = message.role === "user";

                      // Single image - no grid
                      if (numImages === 1) {
                        return {
                          containerClass: "",
                          imageClass: isUserMessage
                            ? (aspectRatio === "9:16" ? "max-w-[200px]" : "max-w-md")
                            : (aspectRatio === "9:16" ? "max-w-sm" : "max-w-3xl")
                        };
                      }

                      // Portrait (9:16) - horizontal layout
                      if (aspectRatio === "9:16") {
                        return {
                          containerClass: `grid gap-2 ${
                            numImages === 2 ? "grid-cols-2" :
                            numImages === 3 ? "grid-cols-3" :
                            "grid-cols-4"
                          } ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
                          imageClass: "w-full"
                        };
                      }

                      // Landscape (16:9, 21:9) - vertical/grid layout
                      if (aspectRatio === "16:9" || aspectRatio === "21:9") {
                        if (numImages === 2) {
                          return {
                            containerClass: `flex flex-col gap-2 ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
                            imageClass: "w-full"
                          };
                        }
                        if (numImages === 3) {
                          return {
                            containerClass: `grid gap-2 ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
                            imageClass: "w-full",
                            customLayout: "2+1" // 2 in first row, 1 in second
                          };
                        }
                        return {
                          containerClass: `grid grid-cols-2 gap-2 ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
                          imageClass: "w-full"
                        };
                      }

                      // Square/Other (1:1, 4:3, 3:2) - horizontal/grid layout
                      if (numImages === 2) {
                        return {
                          containerClass: `grid grid-cols-2 gap-2 ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
                          imageClass: "w-full"
                        };
                      }
                      if (numImages === 3) {
                        return {
                          containerClass: `grid gap-2 ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
                          imageClass: "w-full",
                          customLayout: "2+1" // 2 in first row, 1 in second
                        };
                      }
                      return {
                        containerClass: `grid grid-cols-2 gap-2 ${isUserMessage ? "max-w-md" : "max-w-3xl"}`,
                        imageClass: "w-full"
                      };
                    };

                    const layout = getImageGridLayout();

                    return (
                      <>
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
                                          console.error('Download failed:', error);
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
                                    console.error('Download failed:', error);
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
                        </>
                      );
                    })()}
                  </div>
                )}

              {/* Message Content */}
              {editingId === message.id ? (
                // Edit Mode - Full width like chat input
                <div className="w-full space-y-1.5">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[50px] max-h-[120px] p-3 bg-transparent border-0 rounded-lg text-sm resize-none focus:outline-none placeholder:text-pw-black/30"
                    autoFocus
                  />
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 text-pw-black/40 hover:text-pw-black/60 hover:bg-pw-black/5 rounded transition-colors"
                      title="Abbrechen"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleSaveEdit(message.id)}
                      className="p-1 text-pw-black/40 hover:text-pw-black/60 hover:bg-pw-black/5 rounded transition-colors"
                      title="Senden"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : message.generationType === "image" && isStreamingMessage ? (
                // Image generation placeholder
                <ImageGenerationPlaceholder
                  className={message.imageTask?.aspectRatio === "9:16" ? "max-w-sm" : "max-w-3xl"}
                  aspectRatio={message.imageTask?.aspectRatio || "1:1"}
                  quality={message.imageTask?.quality}
                  style={message.imageTask?.style}
                />
              ) : message.role === "assistant" && !message.content && isStreamingMessage ? (
                // Loading indicator when waiting for response (text chat)
                <div className="flex items-center gap-2 text-pw-black/60">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Denkt nach...</span>
                </div>
              ) : message.content ? (
                // Super Chat: Check if message was ORIGINALLY generated with C1
                message.wasGeneratedWithC1 && message.role === "assistant" && message.isC1Streaming ? (
                  // C1 is still buffering - show loading placeholder
                  <div className="flex items-center gap-2 text-pw-black/60">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{message.content}</span>
                  </div>
                ) : message.wasGeneratedWithC1 && message.role === "assistant" ? (
                  // C1 complete - render interactive components
                  <C1Renderer
                    c1Response={message.content}
                    updateMessage={onEditMessage ? (newContent: string) => onEditMessage(message.id, newContent) : undefined}
                  />
                ) : (
                  // Standard Chat: Regular markdown rendering
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
                )
              ) : null}

              {/* Video Generation Status */}
              {message.videoTask && (
                <div className="mt-3 p-3 bg-pw-black/5 rounded-lg">
                  {message.videoTask.status === "processing" && (
                    <div className="flex items-center gap-2 text-sm text-pw-black/70">
                      <Loader2 className="w-4 h-4 animate-spin text-pw-accent" />
                      <span>Video wird generiert... (dauert ca. 2-5 Min)</span>
                    </div>
                  )}
                  {message.videoTask.status === "failed" && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <X className="w-4 h-4" />
                      <span>Video-Generierung fehlgeschlagen: {message.videoTask.error || "Unbekannter Fehler"}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons - Below Message (Hover to Show) */}
            {!editingId && message.content && (
              <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-60 transition-opacity duration-200">
                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(message.content, message.id)}
                  className="p-1 hover:bg-pw-black/5 rounded transition-colors"
                  title="Kopieren"
                >
                  {copiedId === message.id ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-pw-black/40" />
                  )}
                </button>

                {/* Edit Button - Only for User Messages */}
                {message.role === "user" && (
                  <button
                    onClick={() => handleEdit(message.id, message.content)}
                    className="p-1 hover:bg-pw-black/5 rounded transition-colors"
                    title="Bearbeiten"
                  >
                    <Edit2 className="w-3 h-3 text-pw-black/40" />
                  </button>
                )}
              </div>
            )}
          </div>
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
  // FIXED: Re-render if messages change (including content/attachments updates)
  // Don't just check ID - also check if last message has changed (content or attachments)
  const prevLastMsg = prevProps.messages[prevProps.messages.length - 1];
  const nextLastMsg = nextProps.messages[nextProps.messages.length - 1];

  // If message length changed, definitely re-render
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }

  // If isGenerating status changed, re-render
  if (prevProps.isGenerating !== nextProps.isGenerating) {
    return false;
  }

  // If Super Chat mode changed, re-render
  if (prevProps.isSuperChatEnabled !== nextProps.isSuperChatEnabled) {
    return false;
  }

  // If last message ID changed, re-render
  if (prevLastMsg?.id !== nextLastMsg?.id) {
    return false;
  }

  // If last message content changed, re-render
  if (prevLastMsg?.content !== nextLastMsg?.content) {
    return false;
  }

  // If last message attachments changed (check length and URLs), re-render
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

  // If videoTask status changed, re-render
  if (prevLastMsg?.videoTask?.status !== nextLastMsg?.videoTask?.status) {
    return false;
  }

  // Nothing changed, skip re-render
  return true;
});
