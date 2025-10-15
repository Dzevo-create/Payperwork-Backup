"use client";

import { Message, Attachment } from "@/types/chat";
import { MessageActions } from "./MessageActions";
import { MessageContent } from "../Message/MessageContent";
import { MessageEditMode } from "../Message/MessageEditMode";
import { MessageMetadata } from "../Message/MessageMetadata";
import { MessageAttachments } from "../Message/MessageAttachments";

interface MessageBubbleProps {
  message: Message;
  isLastMessage: boolean;
  isGenerating: boolean;
  editingId: string | null;
  editContent: string;
  copiedId: string | null;
  onEdit: (messageId: string, currentContent: string) => void;
  onSaveEdit: (messageId: string) => void;
  onCancelEdit: () => void;
  onCopy: (content: string, messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onReplyMessage?: (message: Message, specificAttachment?: Attachment) => void;
  setEditContent: (content: string) => void;
  setLightboxImage: (data: { url: string; name: string } | null) => void;
  setLightboxVideo: (data: { url: string; name: string } | null) => void;
  onC1Action?: (data: { llmFriendlyMessage: string }) => void;
}

export function MessageBubble({
  message,
  isLastMessage,
  isGenerating,
  editingId,
  editContent,
  copiedId,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onCopy,
  onEditMessage,
  onReplyMessage,
  setEditContent,
  setLightboxImage,
  setLightboxVideo,
  onC1Action,
}: MessageBubbleProps) {
  const isStreamingMessage =
    isLastMessage && message.role === "assistant" && isGenerating;
  const isEditing = editingId === message.id;
  const isUserMessage = message.role === "user";
  const isC1Message = message.role === "assistant" && message.wasGeneratedWithC1;

  return (
    <div
      id={`message-${message.id}`}
      className={`group flex flex-col ${
        isUserMessage
          ? "items-end pr-12 sm:pr-16 md:pr-24 lg:pr-32"
          : "items-start pl-12 sm:pl-16 md:pl-24 lg:pl-32"
      }`}
    >
      {/* Timestamp */}
      <MessageMetadata
        timestamp={message.timestamp || Date.now()}
        isUserMessage={isUserMessage}
      />

      {/* Message Bubble */}
      <div
        className={`${
          isUserMessage
            ? isEditing
              ? "w-full max-w-3xl px-3 sm:px-4 py-2.5 sm:py-3 bg-white/20 backdrop-blur-xl border border-white/10 text-pw-black shadow-lg rounded-2xl"
              : "inline-block max-w-[85%] md:max-w-[80%] px-3 sm:px-4 py-2.5 sm:py-3 bg-white/90 border border-pw-black/10 text-pw-black shadow-sm rounded-2xl"
            : isC1Message
              ? "max-w-3xl w-full px-4 sm:px-6 py-4 sm:py-5 bg-white/90 border border-pw-black/10 text-pw-black shadow-sm rounded-2xl"
              : "max-w-3xl w-full bg-transparent text-pw-black"
        }`}
      >
        {/* Edit Mode */}
        {isEditing ? (
          <MessageEditMode
            messageId={message.id}
            editContent={editContent}
            onEditContentChange={setEditContent}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        ) : (
          <>
            {/* Attachments */}
            <MessageAttachments
              message={message}
              isStreamingMessage={isStreamingMessage}
              setLightboxImage={setLightboxImage}
              setLightboxVideo={setLightboxVideo}
              onReplyMessage={onReplyMessage}
            />

            {/* Message Content */}
            <MessageContent
              message={message}
              isStreamingMessage={isStreamingMessage}
              onEditMessage={onEditMessage}
              onC1Action={onC1Action}
            />
          </>
        )}
      </div>

      {/* Action Buttons - Below Message (Hover to Show) */}
      {!isEditing && (
        <MessageActions
          message={message}
          copiedId={copiedId}
          onCopy={onCopy}
          onEdit={onEdit}
        />
      )}
    </div>
  );
}
