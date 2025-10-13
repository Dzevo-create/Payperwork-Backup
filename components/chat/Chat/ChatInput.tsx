"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Loader2, X, Reply } from "lucide-react";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useFileUpload } from "@/hooks/useFileUpload";
import { usePromptEnhancement } from "@/hooks/usePromptEnhancement";
import { InputToolbar } from "./InputToolbar";
import { AttachmentGrid } from "./AttachmentGrid";
import { InputActions } from "./InputActions";
import ImageCropModal from "../ImageCrop/ImageCropModal";
import { Attachment, Message } from "@/types/chat";
import { ImageSettingsType } from "./ImageSettings";
import { VideoSettingsType } from "./VideoSettings";

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
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Custom Hooks
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

  // Image crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);
  const [cropImageUrl, setCropImageUrl] = useState<string>("");

  const { isEnhancing, enhancePrompt } = usePromptEnhancement();

  // Set transcription callback
  useEffect(() => {
    setOnTranscriptionComplete((text: string) => {
      setMessage(text);
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
      }
    });
  }, [setOnTranscriptionComplete]);

  // Check for image attachments and notify parent
  useEffect(() => {
    const hasImage = attachments.some(att => att.type === "image");
    onImageAttachmentChange?.(hasImage);
  }, [attachments, onImageAttachmentChange]);

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage?.(message, attachments);
      setMessage("");
      clearAttachments();
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const handleEnhancePrompt = async () => {
    const enhanced = await enhancePrompt({
      prompt: message,
      mode,
      attachments,
      replyTo,
      videoSettings,
      imageSettings,
    });

    setMessage(enhanced);
  };

  // Auto-resize textarea when message changes (e.g., after enhancement)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [message]);

  const handleModeChange = (newMode: "chat" | "image" | "video") => {
    onModeChange?.(newMode);
    setShowDropdown(false);
  };

  const handleFileClickWrapper = () => {
    handleFileClick();
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  // Image editing handlers
  const handleEditImage = (index: number) => {
    const attachment = attachments[index];
    if (attachment.type === "image") {
      setCropImageIndex(index);
      // Use original image if available, otherwise use current image
      const imageToEdit = attachment.originalUrl || attachment.url;
      setCropImageUrl(imageToEdit);
      setCropModalOpen(true);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    if (cropImageIndex !== null) {
      const attachment = attachments[cropImageIndex];
      // Update the attachment with cropped image, but keep original
      updateAttachment(cropImageIndex, {
        url: croppedImageUrl,
        base64: croppedImageUrl,
        // Preserve original for re-cropping
        originalUrl: attachment.originalUrl || attachment.url,
        originalBase64: attachment.originalBase64 || attachment.base64,
      });
    }
  };

  return (
    <div className="px-3 sm:px-4 md:px-6 py-4 bg-transparent">
      <div className="max-w-3xl mx-auto">
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
            <div className="mb-2 flex items-center gap-2 text-sm text-pw-black/60">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Wird transkribiert...</span>
            </div>
          )}

          {/* Uploading Indicator */}
          {isUploading && (
            <div className="mb-2 flex items-center gap-2 text-sm text-pw-black/60">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Datei wird verarbeitet...</span>
            </div>
          )}

          {/* Reply Preview */}
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 px-2.5 py-1.5 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-sm rounded-lg border border-pw-black/10">
              <Reply className="w-3.5 h-3.5 text-pw-black/40 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-pw-black/50 truncate">
                  {(() => {
                    // Check if replyTo has image attachments
                    const imageAttachment = replyTo.attachments?.find(att => att.type === "image");
                    if (imageAttachment) {
                      return `Kontext - ${imageAttachment.name || "Bild"}`;
                    }
                    // Check if replyTo has other attachments
                    const attachment = replyTo.attachments?.[0];
                    if (attachment) {
                      return `Kontext - ${attachment.name || "Anhang"}`;
                    }
                    // Fallback to content or "Kontext"
                    return replyTo.content || "Kontext";
                  })()}
                </div>
              </div>
              <button
                onClick={onCancelReply}
                className="flex-shrink-0 p-0.5 hover:bg-pw-black/10 rounded transition-colors"
                aria-label="Abbrechen"
              >
                <X className="w-3 h-3 text-pw-black/40" />
              </button>
            </div>
          )}

          <div
            className="flex flex-col gap-2 px-3 py-2 bg-gradient-to-br from-white/80 to-white/70 backdrop-blur-lg border border-pw-black/10 rounded-2xl shadow-lg transition-all focus-within:ring-2 focus-within:ring-pw-accent/50 relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Drag & Drop Overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-pw-accent/10 backdrop-blur-sm rounded-2xl border-2 border-dashed border-pw-accent">
                <div className="text-center">
                  <Plus className="w-12 h-12 text-pw-accent mx-auto mb-2 animate-bounce" />
                  <p className="text-sm font-semibold text-pw-accent">Datei hier ablegen</p>
                  <p className="text-xs text-pw-accent/70 mt-1">Bilder & PDFs werden unterstützt</p>
                </div>
              </div>
            )}

            {/* Main Input Row */}
            <div className="flex items-center gap-2">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Toolbar */}
              <InputToolbar
                mode={mode}
                showDropdown={showDropdown}
                isUploading={isUploading}
                onToggleDropdown={() => setShowDropdown(!showDropdown)}
                onModeChange={handleModeChange}
                onFileClick={handleFileClickWrapper}
                dropdownRef={dropdownRef}
              />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Nachricht eingeben..."
                className="flex-1 bg-transparent text-sm text-pw-black placeholder:text-pw-black/40 resize-none outline-none min-h-[20px] max-h-[150px] py-1.5"
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
        onClose={() => {
          setCropModalOpen(false);
          setCropImageIndex(null);
          setCropImageUrl("");
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
