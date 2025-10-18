/**
 * useChatInputState Hook
 *
 * Manages all state for ChatInput component.
 * Centralizes all custom hooks and state management.
 */

import { useState } from 'react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useFileUpload } from '@/hooks/useFileUpload';
import { usePromptEnhancement } from '@/hooks/usePromptEnhancement';
import {
  useDragAndDrop,
  useImageCropping,
  useInputResize,
  useDropdownMenu,
} from '@/hooks/chat/input';
import { calculateTextareaHeight, INPUT_CONSTRAINTS } from '@/config/chatInput';

interface UseChatInputStateProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function useChatInputState({ value, onValueChange }: UseChatInputStateProps) {
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

  return {
    // Message state
    message,
    updateMessage,

    // Voice recording
    isRecording,
    isTranscribing,
    toggleRecording,
    setOnTranscriptionComplete,

    // File upload
    attachments,
    isUploading,
    fileInputRef,
    handleFileClick,
    handleFileChange,
    uploadFiles,
    removeAttachment,
    updateAttachment,
    clearAttachments,

    // Prompt enhancement
    isEnhancing,
    enhancePrompt,

    // Drag and drop
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,

    // Image cropping
    cropModalOpen,
    cropImageUrl,
    openCropModal,
    closeCropModal,
    completeCrop,

    // Input resize
    textareaRef,
    resizeTextarea,
    resetTextarea,

    // Dropdown menu
    showDropdown,
    dropdownRef,
    toggleDropdown,
    closeDropdown,
  };
}
