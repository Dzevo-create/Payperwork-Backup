/**
 * useChatInputHandlers Hook
 *
 * Manages all event handlers and effects for ChatInput component.
 * Handles user interactions and side effects.
 */

import { useEffect } from 'react';
import { Attachment, Message } from '@/types/chat';
import { ImageSettingsType } from '@/components/chat/Chat/ImageSettings';
import { VideoSettingsType } from '@/components/chat/Chat/VideoSettings';
import { canSendMessage, hasImageAttachments } from '@/config/chatInput';

interface UseChatInputHandlersProps {
  // State
  message: string;
  updateMessage: (message: string) => void;
  attachments: Attachment[];
  clearAttachments: () => void;
  updateAttachment: (index: number, data: any) => void;

  // Refs
  textareaRef: React.RefObject<HTMLTextAreaElement>;

  // Functions
  resizeTextarea: (textarea: HTMLTextAreaElement) => void;
  resetTextarea: () => void;
  setOnTranscriptionComplete: (callback: (text: string) => void) => void;
  enhancePrompt: (options: any) => Promise<string>;
  uploadFiles: (files: File[]) => Promise<void>;
  handleDrop: (e: React.DragEvent, callback: (files: File[]) => Promise<void>) => void;
  openCropModal: (index: number, imageUrl: string) => void;
  completeCrop: (croppedImageUrl: string, callback: (index: number, data: any) => void) => void;
  closeDropdown: () => void;

  // Callbacks
  onSendMessage?: (message: string, attachments?: Attachment[]) => void;
  onImageAttachmentChange?: (hasImage: boolean) => void;
  onModeChange?: (mode: "chat" | "image" | "video") => void;
  onValueChange?: (value: string) => void;

  // Context
  mode: "chat" | "image" | "video";
  replyTo?: Message;
  videoSettings?: VideoSettingsType;
  imageSettings?: ImageSettingsType;
}

export function useChatInputHandlers({
  message,
  updateMessage,
  attachments,
  clearAttachments,
  updateAttachment,
  textareaRef,
  resizeTextarea,
  resetTextarea,
  setOnTranscriptionComplete,
  enhancePrompt,
  uploadFiles,
  handleDrop,
  openCropModal,
  completeCrop,
  closeDropdown,
  onSendMessage,
  onImageAttachmentChange,
  onModeChange,
  onValueChange,
  mode,
  replyTo,
  videoSettings,
  imageSettings,
}: UseChatInputHandlersProps) {

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

  // Auto-resize textarea when message changes (e.g., after enhancement)
  useEffect(() => {
    if (textareaRef.current) {
      resizeTextarea(textareaRef.current);
    }
  }, [message]);

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

  const handleModeChange = (newMode: "chat" | "image" | "video") => {
    onModeChange?.(newMode);
    closeDropdown();
  };

  const handleFileClickWrapper = () => {
    // handleFileClick is already defined in fileUpload hook
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
    if (attachment && attachment.type === "image") {
      // Use original image if available, otherwise use current image
      const imageToEdit = attachment.originalUrl || attachment.url;
      openCropModal(index, imageToEdit);
    }
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    completeCrop(croppedImageUrl, (index: number, data: any) => {
      const attachment = attachments[index];
      if (attachment) {
        // Update the attachment with cropped image, but keep original
        updateAttachment(index, {
          ...data,
          // Preserve original for re-cropping
          originalUrl: attachment.originalUrl || attachment.url,
          originalBase64: attachment.originalBase64 || attachment.base64,
        });
      }
    });
  };

  return {
    handleSend,
    handleKeyDown,
    handleInput,
    handleEnhancePrompt,
    handleModeChange,
    handleFileClickWrapper,
    handleDropWithUpload,
    handleEditImage,
    handleCropComplete,
  };
}
