"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, X, Reply } from "lucide-react";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useFileUpload } from "@/hooks/useFileUpload";
import { usePromptEnhancement } from "@/hooks/usePromptEnhancement";
import {
  useDragAndDrop,
  useImageCropping,
  useInputResize,
  useDropdownMenu,
} from "@/hooks/chat/input";
import { InputToolbar } from "./InputToolbar";
import { AttachmentGrid } from "./AttachmentGrid";
import { InputActions } from "./InputActions";
import ImageCropModal from "../ImageCrop/ImageCropModal";
import { Attachment, Message } from "@/types/chat";
import { ImageSettingsType } from "./ImageSettings";
import { VideoSettingsType } from "./VideoSettings";
import {
  UI_TEXT,
  INPUT_CONSTRAINTS,
  STYLE_CLASSES,
  formatReplyPreviewText,
  calculateTextareaHeight,
  canSendMessage,
  hasImageAttachments
} from "@/config/chatInput";

interface ChatInputProps {
  onSendMessage?: (message: string, attachments?: Attachment[]) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  mode?: "chat" | "image" | "video";
  onModeChange?: (mode: "chat" | "image" | "video") => void;
  replyTo?: Message;
  onCancelReply?: () => void;
  showVideoSettings?: boolean;
  videoSettingsSlot?: React.ReactNode;
  videoSettings?: VideoSettingsType;
  showImageSettings?: boolean;
  imageSettingsSlot?: React.ReactNode;
  imageSettings?: ImageSettingsType;
  onImageAttachmentChange?: (hasImage: boolean) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  isSuperChatEnabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  mode = "chat",
  onModeChange,
  replyTo,
  onCancelReply,
  showVideoSettings,
  videoSettingsSlot,
  videoSettings,
  showImageSettings,
  imageSettingsSlot,
  imageSettings,
  onImageAttachmentChange,
  value,
  onValueChange,
  isSuperChatEnabled = false,
}: ChatInputProps) {
  // State - can be controlled from parent via value/onValueChange
  const [internalMessage, setInternalMessage] = useState("");
  const message = value !== undefined ? value : internalMessage;

  // Custom Hooks - Core
  const {
    isRecording,
    isTranscribing,
    toggleRecording,
    setOnTranscriptionComplete,
  } = useVoiceRecording();

  const {
    attachments,
    isUploading,
    fileInputRef,
    handleFileClick,
    handleFileChange,
    handleDrop: uploadFiles,
    removeAttachment,
    updateAttachment,
    clearAttachments,
  } = useFileUpload();

  const { isEnhancing, enhancePrompt } = usePromptEnhancement();

  // Custom Hooks - Input specific
  const { isDragging, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop();

  const {
    cropModalOpen,
    cropImageUrl,
    openCropModal,
    closeCropModal,
    handleCropComplete: completeCrop,
  } = useImageCropping();

  const { textareaRef, resizeTextarea, resetTextarea } = useInputResize(
    calculateTextareaHeight,
    INPUT_CONSTRAINTS.maxHeight
  );

  const { showDropdown, dropdownRef, toggleDropdown, closeDropdown } = useDropdownMenu();

  // Helper to set message (respects controlled/uncontrolled mode)
  const updateMessage = (newMessage: string) => {
    if (onValueChange) {
      onValueChange(newMessage);
    } else {
      setInternalMessage(newMessage);
    }
  };

  // Set transcription callback
  useEffect(() => {
    setOnTranscriptionComplete((text: string) => {
      updateMessage(text);
      if (textareaRef.current) {
        textareaRef.current.focus();
        resizeTextarea(textareaRef.current);
      }
    });
  }, [setOnTranscriptionComplete, onValueChange]);

  // Check for image attachments and notify parent
  useEffect(() => {
    onImageAttachmentChange?.(hasImageAttachments(attachments));
  }, [attachments, onImageAttachmentChange]);

  const handleSend = () => {
    if (canSendMessage(message, attachments)) {
      onSendMessage?.(message, attachments);
      updateMessage("");
      clearAttachments();
      resetTextarea();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateMessage(e.target.value);
    resizeTextarea(e.target);
  };

  const handleEnhancePrompt = async () => {
    const enhanced = await enhancePrompt({
      prompt: message,
      mode,
      attachments,
      replyTo: replyTo ? {
        messageId: replyTo.id,
        content: replyTo.content,
        attachments: replyTo.attachments,
      } : undefined,
      videoSettings,
      imageSettings,
    });

    updateMessage(enhanced);
  };

  // Auto-resize textarea when message changes (e.g., after enhancement)
  useEffect(() => {
    if (textareaRef.current) {
      resizeTextarea(textareaRef.current);
    }
  }, [message]);

  const handleModeChange = (newMode: "chat" | "image" | "video") => {
    onModeChange?.(newMode);
    closeDropdown();
  };

  const handleFileClickWrapper = () => {
    handleFileClick();
    closeDropdown();
  };

  const handleDropWithUpload = (e: React.DragEvent) => {
    handleDrop(e, async (files: File[]) => {
      await uploadFiles(files);
    });
  };

  // Image editing handlers
  const handleEditImage = (index: number) => {
    const attachment = attachments[index];
    if (attachment.type === "image") {
      // Use original image if available, otherwise use current image
      const imageToEdit = attachment.originalUrl || attachment.url;
      openCropModal(index, imageToEdit);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    completeCrop(croppedImageUrl, (index: number, data: any) => {
      const attachment = attachments[index];
      // Update the attachment with cropped image, but keep original
      updateAttachment(index, {
        ...data,
        // Preserve original for re-cropping
        originalUrl: attachment.originalUrl || attachment.url,
        originalBase64: attachment.originalBase64 || attachment.base64,
      });
    });
  };

  return (
    <div className={STYLE_CLASSES.container}>
      <div className={STYLE_CLASSES.maxWidth}>
        {/* Image Settings */}
        {showImageSettings && imageSettingsSlot && (
          <div className="mb-2">{imageSettingsSlot}</div>
        )}

        {/* Video Settings */}
        {showVideoSettings && videoSettingsSlot && (
          <div className="mb-2">{videoSettingsSlot}</div>
        )}

        <div className="w-full">
          {/* Transcribing Indicator */}
          {isTranscribing && (
            <div className={STYLE_CLASSES.indicator}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{UI_TEXT.transcribing}</span>
            </div>
          )}

          {/* Uploading Indicator */}
          {isUploading && (
            <div className={STYLE_CLASSES.indicator}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{UI_TEXT.uploading}</span>
            </div>
          )}

          {/* Reply Preview */}
          {replyTo && (
            <div className={STYLE_CLASSES.replyPreview}>
              <Reply className="w-3.5 h-3.5 text-pw-black/40 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-pw-black/50 truncate">
                  {formatReplyPreviewText(replyTo)}
                </div>
              </div>
              <button
                onClick={onCancelReply}
                className="flex-shrink-0 p-0.5 hover:bg-pw-black/10 rounded transition-colors"
                aria-label={UI_TEXT.replyPreview.cancelLabel}
              >
                <X className="w-3 h-3 text-pw-black/40" />
              </button>
            </div>
          )}

          <div
            className={STYLE_CLASSES.inputWrapper}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropWithUpload}
          >
            {/* Drag & Drop Overlay */}
            {isDragging && (
              <div className={STYLE_CLASSES.dragOverlay}>
                <div className="text-center">
                  <Plus className="w-12 h-12 text-pw-accent mx-auto mb-2 animate-bounce" />
                  <p className="text-sm font-semibold text-pw-accent">{UI_TEXT.dropOverlay.title}</p>
                  <p className="text-xs text-pw-accent/70 mt-1">{UI_TEXT.dropOverlay.subtitle}</p>
                </div>
              </div>
            )}

            {/* Main Input Row */}
            <div className="flex items-center gap-2">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={INPUT_CONSTRAINTS.fileAccept}
                multiple={INPUT_CONSTRAINTS.allowMultiple}
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Toolbar */}
              <InputToolbar
                mode={mode}
                showDropdown={showDropdown}
                isUploading={isUploading}
                onToggleDropdown={toggleDropdown}
                onModeChange={handleModeChange}
                onFileClick={handleFileClickWrapper}
                dropdownRef={dropdownRef}
                isSuperChatEnabled={isSuperChatEnabled}
              />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={UI_TEXT.placeholder}
                className={STYLE_CLASSES.textarea}
                rows={1}
              />

              {/* Actions */}
              <InputActions
                isRecording={isRecording}
                isTranscribing={isTranscribing}
                isEnhancing={isEnhancing}
                isGenerating={!!isGenerating}
                message={message}
                hasAttachments={attachments.length > 0}
                onToggleRecording={toggleRecording}
                onEnhancePrompt={handleEnhancePrompt}
                onSend={handleSend}
                onStopGeneration={onStopGeneration}
                isSuperChatEnabled={isSuperChatEnabled}
                mode={mode}
              />
            </div>

            {/* Attachments */}
            <AttachmentGrid
              attachments={attachments}
              onRemove={removeAttachment}
              onEdit={handleEditImage}
            />
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageUrl={cropImageUrl}
        onClose={closeCropModal}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
