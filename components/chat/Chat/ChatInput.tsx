/**
 * ChatInput Component (REFACTORED)
 *
 * Main chat input component with voice recording, file upload, and prompt enhancement.
 * Now orchestrates extracted hooks and components for better maintainability.
 */

'use client';

import { Plus } from 'lucide-react';
import { useChatInputState } from '@/hooks/chat/useChatInputState';
import { useChatInputHandlers } from '@/hooks/chat/useChatInputHandlers';
import { InputToolbar } from './InputToolbar';
import { AttachmentGrid } from './AttachmentGrid';
import { InputActions } from './InputActions';
import { ChatInputIndicators } from './ChatInputIndicators';
import ImageCropModal from '../ImageCrop/ImageCropModal';
import { Attachment, Message } from '@/types/chat';
import { ImageSettingsType } from './ImageSettings';
import { VideoSettingsType } from './VideoSettings';
import { UI_TEXT, INPUT_CONSTRAINTS, STYLE_CLASSES } from '@/config/chatInput';

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
  // State management
  const state = useChatInputState({ value, onValueChange });

  // Event handlers
  const handlers = useChatInputHandlers({
    message: state.message,
    updateMessage: state.updateMessage,
    attachments: state.attachments,
    clearAttachments: state.clearAttachments,
    updateAttachment: state.updateAttachment,
    textareaRef: state.textareaRef,
    resizeTextarea: state.resizeTextarea,
    resetTextarea: state.resetTextarea,
    setOnTranscriptionComplete: state.setOnTranscriptionComplete,
    enhancePrompt: state.enhancePrompt,
    uploadFiles: state.uploadFiles,
    handleDrop: state.handleDrop,
    openCropModal: state.openCropModal,
    completeCrop: state.completeCrop,
    closeDropdown: state.closeDropdown,
    onSendMessage,
    onImageAttachmentChange,
    onModeChange,
    onValueChange,
    mode,
    replyTo,
    videoSettings,
    imageSettings,
  });

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
          {/* Indicators */}
          <ChatInputIndicators
            isTranscribing={state.isTranscribing}
            isUploading={state.isUploading}
            replyTo={replyTo}
            onCancelReply={onCancelReply}
          />

          <div
            className={STYLE_CLASSES.inputWrapper}
            onDragOver={state.handleDragOver}
            onDragLeave={state.handleDragLeave}
            onDrop={handlers.handleDropWithUpload}
          >
            {/* Drag & Drop Overlay */}
            {state.isDragging && (
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
                ref={state.fileInputRef}
                type="file"
                accept={INPUT_CONSTRAINTS.fileAccept}
                multiple={INPUT_CONSTRAINTS.allowMultiple}
                onChange={state.handleFileChange}
                className="hidden"
              />

              {/* Toolbar */}
              <InputToolbar
                mode={mode}
                showDropdown={state.showDropdown}
                isUploading={state.isUploading}
                onToggleDropdown={state.toggleDropdown}
                onModeChange={handlers.handleModeChange}
                onFileClick={() => {
                  state.handleFileClick();
                  handlers.handleFileClickWrapper();
                }}
                dropdownRef={state.dropdownRef}
                isSuperChatEnabled={isSuperChatEnabled}
              />

              {/* Textarea */}
              <textarea
                ref={state.textareaRef}
                value={state.message}
                onChange={handlers.handleInput}
                onKeyDown={handlers.handleKeyDown}
                placeholder={UI_TEXT.placeholder}
                className={STYLE_CLASSES.textarea}
                rows={1}
              />

              {/* Actions */}
              <InputActions
                isRecording={state.isRecording}
                isTranscribing={state.isTranscribing}
                isEnhancing={state.isEnhancing}
                isGenerating={!!isGenerating}
                message={state.message}
                hasAttachments={state.attachments.length > 0}
                onToggleRecording={state.toggleRecording}
                onEnhancePrompt={handlers.handleEnhancePrompt}
                onSend={handlers.handleSend}
                onStopGeneration={onStopGeneration}
                isSuperChatEnabled={isSuperChatEnabled}
                mode={mode}
              />
            </div>

            {/* Attachments */}
            <AttachmentGrid
              attachments={state.attachments}
              onRemove={state.removeAttachment}
              onEdit={handlers.handleEditImage}
            />
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={state.cropModalOpen}
        imageUrl={state.cropImageUrl}
        onClose={state.closeCropModal}
        onCropComplete={handlers.handleCropComplete}
      />
    </div>
  );
}
