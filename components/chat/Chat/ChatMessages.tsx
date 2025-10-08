"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import { FileText, Loader2, Copy, Check, Edit2, X, Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: {
    type: "image" | "pdf";
    url: string;
    name: string;
  }[];
}

interface ChatMessagesProps {
  messages: Message[];
  isGenerating?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

export function ChatMessages({ messages, isGenerating, onEditMessage }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

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
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const isStreamingMessage = isLastMessage && message.role === "assistant" && isGenerating;

          return (
          <div
            key={message.id}
            className={`group flex flex-col ${
              message.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* Message Bubble */}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                message.role === "user"
                  ? "bg-white/90 border border-pw-black/10 text-pw-black shadow-sm"
                  : "bg-transparent text-pw-black"
              }`}
            >
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {message.attachments.map((att, idx) => (
                    <div key={idx}>
                      {att.type === "image" ? (
                        <div className="relative rounded-lg overflow-hidden">
                          <Image
                            src={att.url}
                            alt={att.name}
                            width={400}
                            height={300}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-pw-black/5 rounded-lg">
                          <FileText className="w-4 h-4 text-pw-black/60" />
                          <span className="text-xs text-pw-black/70">{att.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              {editingId === message.id ? (
                // Edit Mode
                <div className="w-full space-y-1.5">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[50px] max-h-[120px] p-2 bg-white/30 border border-pw-black/5 rounded-lg text-sm resize-none focus:outline-none focus:border-pw-black/10 focus:bg-white/40 transition-colors"
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
              ) : message.role === "assistant" && !message.content && isGenerating ? (
                // Loading indicator when waiting for response
                <div className="flex items-center gap-2 text-pw-black/60">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Denkt nach...</span>
                </div>
              ) : (
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
    </div>
  );
}
