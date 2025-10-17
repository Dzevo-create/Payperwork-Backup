"use client";

import { useCallback, useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatWelcome } from "./ChatWelcome";
import VideoSettings from "./VideoSettings";
import ImageSettings from "./ImageSettings";
import { ToastContainer, ToastMessage } from "@/components/shared/Toast";
import { useChatStore } from "@/store/chatStore.supabase";
import { useLibraryStore } from "@/store/libraryStore.v2";
import { useVideoQueue } from "@/hooks/useVideoQueue";
import { useReplyMessage } from "@/hooks/chat/useReplyMessage";
import { useImageGeneration } from "@/hooks/chat/useImageGeneration";
import { useVideoGeneration } from "@/hooks/chat/useVideoGeneration";
import { useChatMode } from "@/hooks/chat/useChatMode";
import { useConversationManager } from "@/hooks/chat/useConversationManager";
import { useVideoQueueCallbacks } from "@/hooks/chat/useVideoQueueCallbacks";
import { useMessageOrchestrator } from "@/hooks/chat/useMessageOrchestrator";
import { chatLogger } from '@/lib/logger';

interface ChatAreaProps {
  onMenuClick?: () => void;
}

export function ChatArea({ onMenuClick }: ChatAreaProps) {
  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Store access
  const messages = useChatStore((state) => state.messages);
  const isGenerating = useChatStore((state) => state.isGenerating);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const updateMessageWithAttachments = useChatStore((state) => state.updateMessageWithAttachments);
  const setIsGenerating = useChatStore((state) => state.setIsGenerating);
  const setError = useChatStore((state) => state.setError);
  const addToLibrary = useLibraryStore((state) => state.addItem);

  // Custom Hooks - Mode & Settings Management
  const {
    mode,
    selectedModel,
    selectedGPTModel,
    selectedVideoModel,
    videoSettings,
    imageSettings,
    hasImageAttachment,
    inputValue,
    setMode,
    setSelectedModel,
    setSelectedGPTModel,
    setSelectedVideoModel,
    setVideoSettings,
    setImageSettings,
    setHasImageAttachment,
    setInputValue,
  } = useChatMode();

  // Conversation Management
  const {
    chatName,
    isSuperChatEnabled,
    handleChatNameChange,
    handleSuperChatToggle,
  } = useConversationManager();

  // Reply Message Management
  const { replyTo, handleReplyMessage, clearReply } = useReplyMessage({
    onModeChange: setMode,
    onImageSettingsChange: setImageSettings,
  });

  // Image Generation
  const { generateImage } = useImageGeneration({
    imageSettings,
    currentConversationId,
    messages,
    updateMessageWithAttachments,
    setIsGenerating,
    setError,
    addToLibrary: addToLibrary as (item: {
      type: "image" | "video";
      url: string;
      name: string;
      prompt?: string;
      model?: string;
      messageId?: string;
      conversationId?: string;
      metadata?: Record<string, unknown>;
    }) => Promise<void>,
  });

  // Video Generation
  const { handleVideoGeneration } = useVideoGeneration();

  // Video Queue Callbacks
  const { onVideoReady, onVideoFailed, onProgressUpdate } = useVideoQueueCallbacks({
    currentConversationId,
    messages,
    addToLibrary: addToLibrary as any,
  });

  // Video Queue Management
  const { queue, addToQueue, removeFromQueue, updateQueueTaskId, markVideoCompleted } = useVideoQueue({
    onVideoReady,
    onVideoFailed,
    onProgressUpdate,
  });

  // Message Orchestration (handles sending messages)
  const { handleSendMessage, handleStopGeneration, handleEditMessage } = useMessageOrchestrator({
    mode,
    imageSettings,
    videoSettings,
    isSuperChatEnabled,
    selectedVideoModel,
    selectedGPTModel,
    replyTo,
    clearReply,
    generateImage,
    handleVideoGeneration,
    addToQueue,
    updateQueueTaskId,
    markVideoCompleted,
    removeFromQueue,
  });

  // Handle C1 Related Query click - populates input without auto-sending
  const handleC1Action = useCallback((data: { llmFriendlyMessage: string }) => {
    chatLogger.debug('C1 Action triggered:');

    // Extract text from <content> tags
    let cleanedText = data.llmFriendlyMessage;
    const contentMatch = cleanedText.match(/<content>(.*?)<\/content>/);
    if (contentMatch) {
      cleanedText = contentMatch[1];
    }

    // Unescape HTML entities
    cleanedText = cleanedText
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    chatLogger.debug('✨ Cleaned text:');
    setInputValue(cleanedText);
  }, [setInputValue]);

  return (
    <>
      <ChatHeader
        onMenuClick={onMenuClick}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        selectedGPTModel={selectedGPTModel}
        onGPTModelChange={setSelectedGPTModel}
        selectedVideoModel={selectedVideoModel}
        onVideoModelChange={setSelectedVideoModel}
        mode={mode}
        chatName={chatName}
        onChatNameChange={handleChatNameChange}
        isSuperChatEnabled={isSuperChatEnabled}
        onSuperChatToggle={handleSuperChatToggle}
      />
      {messages.length === 0 ? (
        <ChatWelcome onSendMessage={handleSendMessage} />
      ) : (
        <ChatMessages
          messages={messages}
          isGenerating={isGenerating}
          onEditMessage={handleEditMessage}
          onReplyMessage={handleReplyMessage}
          onC1Action={handleC1Action}
        />
      )}
      <ChatInput
        onSendMessage={handleSendMessage}
        isGenerating={isGenerating}
        onStopGeneration={handleStopGeneration}
        mode={mode}
        onModeChange={setMode}
        replyTo={replyTo}
        onCancelReply={clearReply}
        showImageSettings={mode === "image"}
        imageSettingsSlot={
          <ImageSettings
            settings={imageSettings}
            onSettingsChange={setImageSettings}
          />
        }
        imageSettings={imageSettings}
        showVideoSettings={mode === "video"}
        videoSettingsSlot={
          <VideoSettings
            settings={videoSettings}
            onSettingsChange={setVideoSettings}
            hasImageAttachment={hasImageAttachment}
            videoModel={selectedVideoModel}
          />
        }
        videoSettings={videoSettings}
        onImageAttachmentChange={setHasImageAttachment}
        value={inputValue}
        onValueChange={setInputValue}
        isSuperChatEnabled={isSuperChatEnabled}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
}
