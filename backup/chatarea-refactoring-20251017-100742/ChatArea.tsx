"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChatHeader, AIModel, VideoModel, GPTModel } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatWelcome } from "./ChatWelcome";
import VideoSettings, { VideoSettingsType } from "./VideoSettings";
import ImageSettings, { ImageSettingsType } from "./ImageSettings";
import { useChatStore } from "@/store/chatStore.supabase";
import { useLibraryStore } from "@/store/libraryStore.v2";
import { Message, Attachment } from "@/types/chat";
import { useVideoQueue } from "@/hooks/useVideoQueue";
import { useReplyMessage } from "@/hooks/chat/useReplyMessage";
import { useImageGeneration } from "@/hooks/chat/useImageGeneration";
import { useVideoGeneration } from "@/hooks/chat/useVideoGeneration";
import {
  DEFAULT_CHAT_MODE,
  DEFAULT_AI_MODEL,
  DEFAULT_GPT_MODEL,
  DEFAULT_VIDEO_MODEL,
  DEFAULT_CHAT_NAME,
  DEFAULT_VIDEO_SETTINGS,
  DEFAULT_IMAGE_SETTINGS,
  VIDEO_DURATIONS,
  VIDEO_DEFAULT_DURATIONS,
  VIDEO_METADATA,
  VIDEO_MODEL_NAMES,
  ERROR_MESSAGES,
  CHAT_ENDPOINTS,
} from "@/config/chatArea";
import {
  getContextImages,
  createConversationId,
  generateMessageId,
  generateVideoFilename,
  buildNewConversation,
} from "@/lib/utils/chatArea";
import {
  buildUserMessage,
  buildAssistantMessage,
  prepareMessagesForAPI,
} from "@/lib/utils/messageBuilders";
import {
  initializeStreamingState,
  processStandardChunk,
  parseSSELine,
  createUpdateScheduler,
} from "@/lib/utils/streamingHelpers";

interface ChatAreaProps {
  onMenuClick?: () => void;
}

export function ChatArea({ onMenuClick }: ChatAreaProps) {
  const messages = useChatStore((state) => state.messages);
  const isGenerating = useChatStore((state) => state.isGenerating);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const setMessages = useChatStore((state) => state.setMessages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const updateMessageWithAttachments = useChatStore((state) => state.updateMessageWithAttachments);
  const setIsGenerating = useChatStore((state) => state.setIsGenerating);
  const setError = useChatStore((state) => state.setError);
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId);
  const addConversation = useChatStore((state) => state.addConversation);
  const conversations = useChatStore((state) => state.conversations);
  const updateConversation = useChatStore((state) => state.updateConversation);

  const [mode, setMode] = useState<"chat" | "image" | "video">(DEFAULT_CHAT_MODE);
  const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_AI_MODEL);
  const [selectedGPTModel, setSelectedGPTModel] = useState<GPTModel>(DEFAULT_GPT_MODEL);
  const [selectedVideoModel, setSelectedVideoModel] = useState<VideoModel>(DEFAULT_VIDEO_MODEL);
  const [chatName, setChatName] = useState(DEFAULT_CHAT_NAME);
  const [videoSettings, setVideoSettings] = useState<VideoSettingsType>(DEFAULT_VIDEO_SETTINGS);
  const [isSuperChatEnabled, setIsSuperChatEnabled] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Update chat name and SuperChat state when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      const currentConv = conversations.find(c => c.id === currentConversationId);
      if (currentConv) {
        setChatName(currentConv.title);
        setIsSuperChatEnabled(currentConv.isSuperChatEnabled ?? false);
      }
    } else {
      setChatName(DEFAULT_CHAT_NAME);
      setIsSuperChatEnabled(false);
    }
  }, [currentConversationId, conversations]);

  // Update video settings when video model changes
  useEffect(() => {
    const validDurations = VIDEO_DURATIONS[selectedVideoModel];
    const defaultDuration = VIDEO_DEFAULT_DURATIONS[selectedVideoModel];

    if (!validDurations.includes(videoSettings.duration as any)) {
      setVideoSettings(prev => ({ ...prev, duration: defaultDuration }));
    }
  }, [selectedVideoModel, videoSettings.duration]);

  const [imageSettings, setImageSettings] = useState<ImageSettingsType>(DEFAULT_IMAGE_SETTINGS);
  const [hasImageAttachment, setHasImageAttachment] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevConversationIdRef = useRef<string | null>(currentConversationId);
  const addToLibrary = useLibraryStore((state) => state.addItem);

  // Initialize Custom Hooks
  const { replyTo, handleReplyMessage, clearReply } = useReplyMessage({
    onModeChange: setMode,
    onImageSettingsChange: setImageSettings,
  });

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

  const { handleVideoGeneration } = useVideoGeneration();

  // Initialize video queue hook
  const { queue, addToQueue, removeFromQueue, updateQueueTaskId, markVideoCompleted } = useVideoQueue({
    onVideoReady: async (messageId, videoUrl) => {
      console.log("🔥 onVideoReady CALLED IN ChatArea:", { messageId, videoUrl });

      const fileName = generateVideoFilename();

      // Get the message to retrieve the actual video settings
      const message = messages.find((m) => m.id === messageId);
      const videoTask = message?.videoTask;

      console.log("🔧 Calling updateMessageWithAttachments with:", {
        messageId,
        fileName,
        videoUrl,
        preservedMetadata: videoTask,
      });

      // Preserve actual video settings from the message's videoTask instead of using hardcoded defaults
      updateMessageWithAttachments(
        messageId,
        ERROR_MESSAGES.videoGenerationSuccess,
        [{ type: "video", url: videoUrl, name: fileName }],
        {
          status: "succeed",
          taskId: videoTask?.taskId || "",
          model: videoTask?.model || VIDEO_METADATA.defaultModel,
          type: videoTask?.type || VIDEO_METADATA.defaultType,
          duration: videoTask?.duration || "5",
          aspectRatio: videoTask?.aspectRatio || "16:9",
          progress: VIDEO_METADATA.completionProgress,
        }
      );

      console.log("✅ updateMessageWithAttachments CALLED");

      // Add to library
      try {
        console.log("📚 Adding video to library");

        // Use model name from videoTask if available
        const modelName = videoTask?.model === "payperwork-v2"
          ? VIDEO_MODEL_NAMES["sora2"]
          : VIDEO_MODEL_NAMES["move"];

        await addToLibrary({
          type: "video",
          url: videoUrl,
          name: fileName,
          prompt: message?.content,
          model: modelName,
          messageId: messageId,
          conversationId: currentConversationId || undefined,
          metadata: {
            duration: (videoTask?.duration || "5") + "s",
            aspectRatio: videoTask?.aspectRatio || "16:9",
          },
        });
        console.log("✅ Video successfully added to library");
      } catch (error) {
        console.error("❌ Failed to add video to library:", error);
      }
    },
    onVideoFailed: (messageId, error) => {
      const currentMessage = messages.find(m => m.id === messageId);
      if (currentMessage?.videoTask) {
        updateMessageWithAttachments(
          messageId,
          `${ERROR_MESSAGES.videoGenerationFailed}: ${error}`,
          currentMessage.attachments || [],
          { ...currentMessage.videoTask, status: "failed", error }
        );
      } else {
        updateMessage(messageId, `${ERROR_MESSAGES.videoGenerationFailed}: ${error}`);
      }
    },
    onProgressUpdate: (messageId, progress, estimatedTimeRemaining) => {
      // Update message videoTask with progress
      const currentMessage = messages.find(m => m.id === messageId);
      if (currentMessage?.videoTask) {
        updateMessageWithAttachments(
          messageId,
          currentMessage.content,
          currentMessage.attachments || [],
          {
            ...currentMessage.videoTask,
            progress,
            estimatedTimeRemaining,
          }
        );
      }
    },
  });

  // NOTE: AbortController cleanup removed - it was causing premature request cancellation
  // during normal re-renders (e.g., when conversation title updates). Manual stop is
  // available via handleStopGeneration. The browser automatically cancels fetch on page unload.

  // Reset generation state when switching conversations
  useEffect(() => {
    // Only abort if conversation ID actually changed (not just initialized)
    const prevId = prevConversationIdRef.current;
    const hasActuallyChanged = prevId !== null && prevId !== currentConversationId;

    if (hasActuallyChanged && abortControllerRef.current) {
      console.log("🔄 Conversation switched during generation - aborting current request");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }

    // Update ref for next render
    prevConversationIdRef.current = currentConversationId;
  }, [currentConversationId, setIsGenerating]);

  // Request notification permission when entering video mode
  useEffect(() => {
    if (mode === 'video' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          console.log('Notification permission:', permission);
        });
      }
    }
  }, [mode]);

  // Scroll to message when video is clicked in queue
  const handleVideoClick = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (content: string, attachments?: Attachment[]) => {
    // Get context images from reply or last assistant message
    const contextImages = await getContextImages(replyTo, messages, mode, attachments);

    // IMPORTANT: Create conversation FIRST if this is the first message
    if (!currentConversationId && messages.length === 0) {
      const newConvId = createConversationId();
      console.log("🆕 Creating new conversation BEFORE first message:", newConvId);
      setCurrentConversationId(newConvId);
      await addConversation(buildNewConversation(newConvId, DEFAULT_CHAT_NAME, isSuperChatEnabled));
      console.log("✅ Conversation created in Supabase with SuperChat:", isSuperChatEnabled);
    }

    // Build and add user message
    const userMessage = buildUserMessage({
      content,
      attachments,
      replyTo,
      replyAttachments: replyTo?.attachments || [],
    });
    await addMessage(userMessage);

    // Clear reply state after sending
    clearReply();

    // Create assistant message placeholder for streaming
    const assistantMessage = buildAssistantMessage({
      mode,
      imageSettings,
      isSuperChatEnabled: mode === "chat" ? isSuperChatEnabled : false, // Only for chat mode
    });

    addMessage(assistantMessage);

    // Create AbortController for this request
    abortControllerRef.current = new AbortController();
    setIsGenerating(true);

    try {
      // IMAGE MODE: Call Nano Banana API
      if (mode === "image") {
        await generateImage({
          content,
          assistantMessageId: assistantMessage.id,
          attachments,
          contextImages,
          abortSignal: abortControllerRef.current.signal,
        });
        return;
      }

      // VIDEO MODE: Call unified Video API
      if (mode === "video") {
        await handleVideoGeneration({
          content,
          attachments,
          contextImages,
          videoSettings,
          selectedVideoModel,
          assistantMessageId: assistantMessage.id,
          currentConversationId,
          updateMessageWithAttachments,
          addToQueue,
          updateQueueTaskId,
          markVideoCompleted,
          removeFromQueue,
          setIsGenerating,
          setError,
          messages,
        });
        return;
      }

      // CHAT MODE: Call appropriate API based on SuperChat toggle
      const endpoint = isSuperChatEnabled ? "/api/chat-c1" : CHAT_ENDPOINTS.standard;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: prepareMessagesForAPI(messages, userMessage, contextImages),
          gptModel: selectedGPTModel, // Pass selected GPT model (gpt-4o or gpt-5) - only used for standard chat
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || ERROR_MESSAGES.apiError);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error(ERROR_MESSAGES.noResponseBody);

      const decoder = new TextDecoder();

      // Standard chat streaming
      let streamState = initializeStreamingState();
      const scheduleUpdate = createUpdateScheduler((content: string) =>
        updateMessage(assistantMessage.id, content, true)
      );

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          const parsed = parseSSELine(line);
          if (!parsed) continue;

          const textContent = parsed.content;
          const result = processStandardChunk(streamState, textContent);
          streamState = result.state;
          scheduleUpdate(result.displayContent);
        }
      }

      // Save final accumulated content
      await updateMessage(assistantMessage.id, streamState.accumulatedContent);

      setIsGenerating(false);
      abortControllerRef.current = null;
      setError(null);
    } catch (error) {
      setIsGenerating(false);
      abortControllerRef.current = null;

      // Handle abort
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Generation stopped by user");
        return;
      }

      console.error("Error calling API:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      setError({
        message: errorMessage || "Ein Fehler ist aufgetreten",
        retryable: true,
      });

      updateMessage(assistantMessage.id, ERROR_MESSAGES.processingError);
    }
  };

  const handleChatNameChange = useCallback(async (newName: string) => {
    setChatName(newName);

    // Update conversation in store if we have a current conversation
    if (currentConversationId) {
      await updateConversation(currentConversationId, { title: newName });
    }
  }, [currentConversationId, updateConversation]);

  const handleSuperChatToggle = useCallback(async (enabled: boolean) => {
    setIsSuperChatEnabled(enabled);

    // Update conversation in store if we have a current conversation
    if (currentConversationId) {
      await updateConversation(currentConversationId, { isSuperChatEnabled: enabled });
    }
  }, [currentConversationId, updateConversation]);

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    // Find the message index
    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) return;

    // Get the edited message
    const editedMessage = messages[messageIndex];

    // Remove all messages after the edited message
    const newMessages = messages.slice(0, messageIndex);

    // Update messages
    setMessages(newMessages);

    // Resend the edited message
    handleSendMessage(newContent, editedMessage.attachments);
  }, [messages, setMessages, handleSendMessage]);

  // Handle C1 Related Query click - populates input without auto-sending
  const handleC1Action = useCallback((data: { llmFriendlyMessage: string }) => {
    console.log("🎯 C1 Action triggered:", data);

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

    console.log("✨ Cleaned text:", cleanedText);
    setInputValue(cleanedText);
  }, []);

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
    </>
  );
}
