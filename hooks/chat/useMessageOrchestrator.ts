/**
 * useMessageOrchestrator Hook
 *
 * Orchestrates message sending logic across chat/image/video modes.
 * Handles conversation creation, message building, API calls, and streaming.
 * Extracted from ChatArea.tsx for better separation of concerns.
 */

import { useRef, useCallback, useEffect } from "react";
import { useChatStore } from "@/store/chatStore.supabase";
import { Message, Attachment } from "@/types/chat";
import { ImageSettingsType } from "@/components/chat/Chat/ImageSettings";
import { VideoSettingsType } from "@/components/chat/Chat/VideoSettings";
import { VideoModel, GPTModel } from "@/components/chat/Chat/ChatHeader";
import { chatLogger } from '@/lib/logger';
import { requestQueue } from '@/lib/requestQueue';
import {
  getContextImages,
  createConversationId,
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
import {
  DEFAULT_CHAT_NAME,
  ERROR_MESSAGES,
  CHAT_ENDPOINTS,
} from "@/config/chatArea";

interface UseMessageOrchestratorParams {
  mode: "chat" | "image" | "video";
  imageSettings: ImageSettingsType;
  videoSettings: VideoSettingsType;
  isSuperChatEnabled: boolean;
  selectedVideoModel: VideoModel;
  selectedGPTModel: GPTModel;
  replyTo: Message | null;
  clearReply: () => void;
  generateImage: (params: {
    content: string;
    assistantMessageId: string;
    attachments?: Attachment[];
    contextImages: Attachment[];
    abortSignal: AbortSignal;
  }) => Promise<void>;
  handleVideoGeneration: (params: any) => Promise<void>;
  addToQueue: (messageId: string, metadata?: any) => void;
  updateQueueTaskId: (messageId: string, taskId: string) => void;
  markVideoCompleted: (messageId: string) => void;
  removeFromQueue: (messageId: string) => void;
}

export function useMessageOrchestrator({
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
}: UseMessageOrchestratorParams) {
  const messages = useChatStore((state) => state.messages);
  const currentConversationId = useChatStore((state) => state.currentConversationId);
  const setCurrentConversationId = useChatStore((state) => state.setCurrentConversationId);
  const addMessage = useChatStore((state) => state.addMessage);
  const addMessageToConversation = useChatStore((state) => state.addMessageToConversation);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const updateMessageInConversation = useChatStore((state) => state.updateMessageInConversation);
  const updateMessageWithAttachments = useChatStore((state) => state.updateMessageWithAttachments);
  const setMessages = useChatStore((state) => state.setMessages);
  const setIsGenerating = useChatStore((state) => state.setIsGenerating);
  const setError = useChatStore((state) => state.setError);
  const addConversation = useChatStore((state) => state.addConversation);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);
  const prevConversationIdRef = useRef<string | null>(currentConversationId);

  // MULTI-CONVERSATION SUPPORT: Do NOT abort requests when switching conversations
  // This allows multiple conversations to process responses in the background
  useEffect(() => {
    const prevId = prevConversationIdRef.current;
    const hasActuallyChanged = prevId !== null && prevId !== currentConversationId;

    if (hasActuallyChanged && prevId) {
      chatLogger.info(`Conversation switched from ${prevId} to ${currentConversationId} - background requests continue`);

      // Clear local refs only if they belonged to the previous conversation
      // This prevents UI showing "generating" state for the new conversation
      if (abortControllerRef.current && currentRequestIdRef.current) {
        const request = requestQueue.getRequest(currentRequestIdRef.current);
        if (request && request.conversationId === prevId) {
          abortControllerRef.current = null;
          currentRequestIdRef.current = null;
        }
      }

      // Set generating to false for the NEW conversation (old one continues in background)
      setIsGenerating(false);
    }

    // Update ref for next render
    prevConversationIdRef.current = currentConversationId;
  }, [currentConversationId, setIsGenerating]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup old requests on unmount
      requestQueue.cleanup();
    };
  }, []);

  const handleStopGeneration = useCallback(() => {
    if (currentRequestIdRef.current) {
      chatLogger.info(`Manually stopping request: ${currentRequestIdRef.current}`);
      requestQueue.abortRequest(currentRequestIdRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    currentRequestIdRef.current = null;
    setIsGenerating(false);
  }, [setIsGenerating]);

  const handleSendMessage = useCallback(async (content: string, attachments?: Attachment[]) => {
    // CRITICAL: Capture conversation ID at the start of the request
    // This ensures we route responses to the correct conversation even if user switches
    let targetConversationId = currentConversationId;

    // Get context images from reply or last assistant message
    const contextImages = await getContextImages(replyTo, messages, mode, attachments);

    // IMPORTANT: Create conversation FIRST if this is the first message
    if (!targetConversationId && messages.length === 0) {
      const newConvId = createConversationId();
      chatLogger.debug('Creating new conversation BEFORE first message:');
      setCurrentConversationId(newConvId);
      await addConversation(buildNewConversation(newConvId, DEFAULT_CHAT_NAME, isSuperChatEnabled));
      chatLogger.info('Conversation created in Supabase with SuperChat:');
      targetConversationId = newConvId;
    }

    // Ensure we have a target conversation
    if (!targetConversationId) {
      chatLogger.error('Cannot send message: No conversation ID');
      return;
    }

    // Build and add user message
    const userMessage = buildUserMessage({
      content,
      attachments,
      replyTo,
      replyAttachments: replyTo?.attachments || [],
    });
    await addMessageToConversation(targetConversationId, userMessage);

    // Clear reply state after sending
    clearReply();

    // Create assistant message placeholder for streaming
    const assistantMessageParams = {
      mode,
      imageSettings,
      isSuperChatEnabled: mode === "chat" ? isSuperChatEnabled : false, // Only for chat mode
    };

    chatLogger.debug('Building assistant message with params:', {
      mode,
      isSuperChatEnabled,
      willSetC1Flag: mode === "chat" && isSuperChatEnabled,
    });

    const assistantMessage = buildAssistantMessage(assistantMessageParams);

    chatLogger.debug('Created assistant message:', {
      id: assistantMessage.id,
      wasGeneratedWithC1: assistantMessage.wasGeneratedWithC1,
      isC1Streaming: assistantMessage.isC1Streaming,
    });

    await addMessageToConversation(targetConversationId, assistantMessage);

    // Create AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Generate unique request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentRequestIdRef.current = requestId;

    // Register request in the queue
    requestQueue.startRequest({
      id: requestId,
      conversationId: targetConversationId,
      messageId: assistantMessage.id,
      abortController,
      metadata: {
        mode,
        model: mode === 'chat' ? selectedGPTModel : mode === 'video' ? selectedVideoModel : undefined,
      },
    });

    setIsGenerating(true);

    try {
      // IMAGE MODE: Call Nano Banana API
      if (mode === "image") {
        requestQueue.updateStatus(requestId, 'streaming');
        await generateImage({
          content,
          assistantMessageId: assistantMessage.id,
          attachments,
          contextImages,
          abortSignal: abortController.signal,
        });
        requestQueue.updateStatus(requestId, 'completed');
        return;
      }

      // VIDEO MODE: Call unified Video API
      if (mode === "video") {
        requestQueue.updateStatus(requestId, 'streaming');
        await handleVideoGeneration({
          content,
          attachments,
          contextImages,
          videoSettings,
          selectedVideoModel,
          assistantMessageId: assistantMessage.id,
          currentConversationId: targetConversationId,
          updateMessageWithAttachments,
          addToQueue,
          updateQueueTaskId,
          markVideoCompleted,
          removeFromQueue,
          setIsGenerating,
          setError,
          messages,
        });
        requestQueue.updateStatus(requestId, 'completed');
        return;
      }

      // CHAT MODE: Call appropriate API based on SuperChat toggle
      requestQueue.updateStatus(requestId, 'streaming');

      const endpoint = isSuperChatEnabled ? "/api/chat-c1" : CHAT_ENDPOINTS.standard;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: prepareMessagesForAPI(messages, userMessage, contextImages),
          gptModel: selectedGPTModel, // Pass selected GPT model (gpt-4o or gpt-5) - only used for standard chat
        }),
        signal: abortController.signal,
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
        updateMessageInConversation(targetConversationId, assistantMessage.id, content, true)
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
      await updateMessageInConversation(targetConversationId, assistantMessage.id, streamState.accumulatedContent);

      // Mark request as completed
      requestQueue.updateStatus(requestId, 'completed');

      setIsGenerating(false);
      abortControllerRef.current = null;
      currentRequestIdRef.current = null;
      setError(null);
    } catch (error) {
      // Handle abort
      if (error instanceof Error && error.name === "AbortError") {
        chatLogger.debug('Generation stopped by user or conversation switched');
        requestQueue.updateStatus(requestId, 'aborted');
        setIsGenerating(false);
        abortControllerRef.current = null;
        currentRequestIdRef.current = null;
        return;
      }

      // Mark request as failed
      requestQueue.updateStatus(requestId, 'failed');

      setIsGenerating(false);
      abortControllerRef.current = null;
      currentRequestIdRef.current = null;

      chatLogger.error('Error calling API:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      setError({
        message: errorMessage || "Ein Fehler ist aufgetreten",
        retryable: true,
      });

      updateMessageInConversation(targetConversationId, assistantMessage.id, ERROR_MESSAGES.processingError);
    }
  }, [
    mode,
    imageSettings,
    videoSettings,
    isSuperChatEnabled,
    selectedVideoModel,
    selectedGPTModel,
    replyTo,
    clearReply,
    messages,
    currentConversationId,
    setCurrentConversationId,
    addMessage,
    addMessageToConversation,
    updateMessage,
    updateMessageInConversation,
    updateMessageWithAttachments,
    setIsGenerating,
    setError,
    addConversation,
    generateImage,
    handleVideoGeneration,
    addToQueue,
    updateQueueTaskId,
    markVideoCompleted,
    removeFromQueue,
  ]);

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

  return {
    handleSendMessage,
    handleStopGeneration,
    handleEditMessage,
  };
}
