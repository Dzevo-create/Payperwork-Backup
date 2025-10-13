"use client";

import { useRef, useState, useEffect } from "react";
import { ChatHeader, AIModel, VideoModel } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatWelcome } from "./ChatWelcome";
import VideoSettings, { VideoSettingsType } from "./VideoSettings";
import ImageSettings, { ImageSettingsType } from "./ImageSettings";
import { useChatStore } from "@/store/chatStore.supabase";
import { useSuperChatStore } from "@/store/superChatStore";
import { useLibraryStore } from "@/store/libraryStore.v2";
import { Message, Attachment } from "@/types/chat";
import { useVideoQueue } from "@/hooks/useVideoQueue";
import { convertImageUrlToBase64 } from "@/lib/imageUtils";
import { getCachedBase64 } from "@/lib/utils/imageCache";
import { useReplyMessage } from "@/hooks/chat/useReplyMessage";
import { useImageGeneration } from "@/hooks/chat/useImageGeneration";
import { useVideoGeneration } from "@/hooks/chat/useVideoGeneration";

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

  // Super Chat state
  const isSuperChatEnabled = useSuperChatStore((state) => state.isSuperChatEnabled);

  const [mode, setMode] = useState<"chat" | "image" | "video">("chat");
  const [selectedModel, setSelectedModel] = useState<AIModel>("chatgpt");
  const [selectedVideoModel, setSelectedVideoModel] = useState<VideoModel>("kling");
  const [chatName, setChatName] = useState("Neuer Chat");
  const [videoSettings, setVideoSettings] = useState<VideoSettingsType>({
    duration: "5",
    aspectRatio: "16:9",
    mode: "std",
    audioEnabled: true, // Sora 2: Audio on by default
  });

  // Update video settings when video model changes
  useEffect(() => {
    if (selectedVideoModel === "sora2") {
      // Sora 2: Default to 4s if current duration is not valid for Sora
      if (!["4", "8", "12"].includes(videoSettings.duration)) {
        setVideoSettings(prev => ({ ...prev, duration: "4" }));
      }
    } else if (selectedVideoModel === "kling") {
      // Kling: Default to 5s if current duration is not valid for Kling
      if (!["5", "10"].includes(videoSettings.duration)) {
        setVideoSettings(prev => ({ ...prev, duration: "5" }));
      }
    }
  }, [selectedVideoModel, videoSettings.duration]);

  const [imageSettings, setImageSettings] = useState<ImageSettingsType>({
    preset: "none",
    quality: "ultra",
    aspectRatio: "16:9",
    numImages: 1,
  });
  const [hasImageAttachment, setHasImageAttachment] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
  const { queue, addToQueue, removeFromQueue, updateQueueTaskId } = useVideoQueue({
    onVideoReady: async (messageId, videoUrl) => {
      console.log("🔥 onVideoReady CALLED IN ChatArea:", { messageId, videoUrl });

      // Update message with video URL
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `payperwork-${dateStr}-${timeStr}.mp4`;

      console.log("🔧 Calling updateMessageWithAttachments with:", {
        messageId,
        fileName,
        videoUrl,
      });

      updateMessageWithAttachments(
        messageId,
        "✅ Video wurde erfolgreich generiert!",
        [
          {
            type: "video",
            url: videoUrl,
            name: fileName,
          },
        ],
        {
          status: "succeed",
          taskId: "",
          model: "payperwork-v1",
          type: "text2video",
          duration: "5",
          aspectRatio: "16:9",
          progress: 100,
        }
      );

      console.log("✅ updateMessageWithAttachments CALLED");

      // Add to library
      const message = messages.find((m) => m.id === messageId);
      try {
        console.log("📚 Adding video to library with:", {
          type: "video",
          url: videoUrl,
          name: fileName,
          prompt: message?.content,
          model: selectedVideoModel === "kling" ? "Payperwork Video v1" : "Payperwork Video v2",
          messageId: messageId,
          conversationId: currentConversationId,
          metadata: {
            duration: videoSettings.duration + "s",
            aspectRatio: videoSettings.aspectRatio,
          },
        });

        await addToLibrary({
          type: "video",
          url: videoUrl,
          name: fileName,
          prompt: message?.content,
          model: selectedVideoModel === "kling" ? "Payperwork Video v1" : "Payperwork Video v2",
          messageId: messageId,
          conversationId: currentConversationId || undefined,
          metadata: {
            duration: videoSettings.duration + "s",
            aspectRatio: videoSettings.aspectRatio,
          },
        });
        console.log("✅ Video successfully added to library");
      } catch (error) {
        console.error("❌ Failed to add video to library:", error);
      }
    },
    onVideoFailed: (messageId, error) => {
      // Update message with error and videoTask status
      const currentMessage = messages.find(m => m.id === messageId);
      if (currentMessage?.videoTask) {
        updateMessageWithAttachments(
          messageId,
          `❌ Videogenerierung fehlgeschlagen: ${error}`,
          currentMessage.attachments || [],
          {
            ...currentMessage.videoTask,
            status: "failed",
            error: error,
          }
        );
      } else {
        // Fallback if no videoTask exists
        updateMessage(
          messageId,
          `❌ Videogenerierung fehlgeschlagen: ${error}`
        );
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
    // Check if replying to a message or if the last assistant message has attachments
    let contextImages: Attachment[] = [];

    // Priority 1: If replying to a message, use the attachments from the replyTo message
    if (replyTo) {
      // replyTo is the complete Message object, so we can directly access its attachments
      if (replyTo.attachments && replyTo.attachments.length > 0) {
        const imageAttachments = replyTo.attachments.filter(att => att.type === "image");
        if (imageAttachments.length > 0) {
          // Convert Supabase URLs to base64 for Gemini API (with caching)
          const conversions = await Promise.all(
            imageAttachments.map(async (att) => {
              try {
                // Use cached conversion if available
                const base64 = await getCachedBase64(att.url, convertImageUrlToBase64);
                return {
                  type: "image",
                  url: att.url,  // Keep original URL
                  name: att.name,
                  base64: base64,  // Cached or fresh base64 data URL
                };
              } catch (error) {
                console.error(`Failed to convert image ${att.name}:`, error);
                return null;
              }
            })
          );

          // Filter out failed conversions
          contextImages = conversions.filter((img): img is Attachment & { base64: string } => img !== null);
        }
      }
    }
    // Priority 2: If in chat mode and last message has images, use those as context
    else if (mode === "chat" && messages.length > 0 && !attachments?.length) {
      const lastMessage = messages[messages.length - 1];

      // If last message is from assistant and has image attachments
      if (lastMessage.role === "assistant" && lastMessage.attachments?.length) {
        const imageAttachments = lastMessage.attachments.filter(att => att.type === "image");

        // If user didn't provide their own attachments, use the assistant's images as context
        if (imageAttachments.length > 0) {
          // Convert Supabase URLs to base64 for Gemini API (with caching)
          const conversions = await Promise.all(
            imageAttachments.map(async (att) => {
              try {
                // Use cached conversion if available
                const base64 = await getCachedBase64(att.url, convertImageUrlToBase64);
                return {
                  type: "image",
                  url: att.url,
                  name: att.name,
                  base64: base64,  // Cached or fresh base64 data URL
                };
              } catch (error) {
                console.error(`Failed to convert image ${att.name}:`, error);
                return null;
              }
            })
          );

          // Filter out failed conversions
          contextImages = conversions.filter((img): img is Attachment & { base64: string } => img !== null);
        }
      }
    }

    // IMPORTANT: Create conversation FIRST if this is the first message
    if (!currentConversationId && messages.length === 0) {
      const newConvId = Date.now().toString();
      console.log("🆕 Creating new conversation BEFORE first message:", newConvId);

      setCurrentConversationId(newConvId);

      // Create conversation in Supabase immediately
      const newConversation = {
        id: newConvId,
        title: "Neuer Chat",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addConversation(newConversation);
      console.log("✅ Conversation created in Supabase");
    }

    // Add user message WITH reply attachments as thumbnails
    // Combine user-uploaded attachments with reply attachments for display
    const allAttachments = [
      ...(attachments || []),
      ...(replyTo?.attachments || []) // Add reply attachments as thumbnails
    ];

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content,
      timestamp: new Date(),
      attachments: allAttachments, // User uploads + Reply attachments (for thumbnail display)
      replyTo: replyTo ? {
        messageId: replyTo.id, // Use the id from the replyTo Message object
        content: replyTo.content,
        // Don't store attachments in replyTo to avoid localStorage overflow
        // We only need the messageId to reference the original message
      } : undefined,
    };

    await addMessage(userMessage);

    // Clear reply state after sending
    clearReply();

    // Create assistant message placeholder for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      generationType: mode === "image" ? "image" : mode === "video" ? "video" : "text",
      generationAttempt: mode === "image" ? 1 : undefined,
      generationMaxAttempts: mode === "image" ? 3 : undefined, // maxRetries + 1
      wasGeneratedWithC1: mode === "chat" ? isSuperChatEnabled : undefined, // Track if C1 was used
      imageTask: mode === "image" ? {
        aspectRatio: imageSettings.aspectRatio,
        quality: imageSettings.quality,
        style: imageSettings.style,
        lighting: imageSettings.lighting,
      } : undefined,
    };

    addMessage(assistantMessage);

    // Create AbortController for this request
    abortControllerRef.current = new AbortController();
    setIsGenerating(true);

    try {
      // IMAGE MODE: Call Nano Banana API
      if (mode === "image") {
        await generateImage({
          content,
          assistantMessageId,
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
          assistantMessageId,
          currentConversationId,
          updateMessageWithAttachments,
          addToQueue,
          updateQueueTaskId,
          removeFromQueue,
          setIsGenerating,
          setError,
          messages,
        });
        return;
      }

      // CHAT MODE: Call API based on Super Chat state
      // Super Chat: /api/chat-c1 (C1 Generative UI)
      // Standard Chat: /api/chat (OpenAI GPT-4o)
      const chatEndpoint = isSuperChatEnabled ? "/api/chat-c1" : "/api/chat";

      const response = await fetch(chatEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg, idx) => {
            // For the user message we just added, include context images if any
            const isCurrentUserMessage = idx === messages.length && msg.role === "user";
            const finalAttachments = isCurrentUserMessage && contextImages.length > 0
              ? [...(msg.attachments || []), ...contextImages]
              : msg.attachments;

            return {
              role: msg.role,
              content: msg.content,
              // OpenAI doesn't allow images in assistant messages, only in user messages
              attachments: msg.role === "assistant" ? undefined : finalAttachments,
            };
          }),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response from API");
      }

      // Handle streaming response with batching (ChatGPT-style)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let accumulatedContent = "";
      let updateScheduled = false;

      // C1-specific buffering: accumulate until we have complete content
      let c1Buffer = "";
      let isInsideC1Content = false;
      let hasC1CompleteContent = false;

      // Batch updates with requestAnimationFrame for smooth rendering
      // FIX: Use updateMessage instead of setMessages to avoid triggering restore effect
      const scheduleUpdate = (content: string, isC1Streaming = false) => {
        if (!updateScheduled) {
          updateScheduled = true;
          requestAnimationFrame(() => {
            // Update only the specific message - this doesn't trigger ChatLayout restore effect
            updateMessage(assistantMessageId, content);
            // Note: isC1Streaming is handled separately via message content checks
            updateScheduled = false;
          });
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const textContent = parsed.content || "";

              // Handle C1 responses (wrapped in <content> tags)
              if (isSuperChatEnabled) {
                c1Buffer += textContent;

                // Check if we're starting C1 content
                if (c1Buffer.includes("<content>")) {
                  isInsideC1Content = true;
                }

                // Check if we have complete C1 response
                if (isInsideC1Content && c1Buffer.includes("</content>")) {
                  // Extract clean content between tags
                  const match = c1Buffer.match(/<content>([\s\S]*?)<\/content>/);
                  if (match) {
                    const cleanC1Content = match[1].trim();
                    hasC1CompleteContent = true;
                    scheduleUpdate(cleanC1Content, false); // C1 complete, ready to render
                    isInsideC1Content = false;
                    c1Buffer = ""; // Clear buffer
                  }
                } else if (isInsideC1Content) {
                  // Still buffering C1 content - show placeholder
                  scheduleUpdate("⏳ Generating interactive response...", true);
                } else {
                  // Haven't found <content> tag yet, might be regular text or incomplete
                  // Just buffer it, don't show anything yet
                }
              } else {
                // Standard chat: accumulate content normally
                accumulatedContent += textContent;
                scheduleUpdate(accumulatedContent, false);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Final update to ensure all content is displayed
      if (isSuperChatEnabled) {
        if (!hasC1CompleteContent && c1Buffer.length > 0) {
          // If we have buffered content but never found complete tags,
          // try to extract content or just show the buffer
          const match = c1Buffer.match(/<content>([\s\S]*?)(?:<\/content>)?$/);
          if (match) {
            const cleanContent = match[1].trim();
            updateMessage(assistantMessageId, cleanContent);
          } else {
            // No tags found at all, just show buffer content
            updateMessage(assistantMessageId, c1Buffer);
          }
        }
        // else: C1 content already updated with clean content
      } else {
        updateMessage(assistantMessageId, accumulatedContent);
      }
      setIsGenerating(false);
      abortControllerRef.current = null;
      setError(null);
    } catch (error) {
      setIsGenerating(false);
      abortControllerRef.current = null;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Handle abort
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Generation stopped by user");
        return;
      }

      console.error("Error calling OpenAI API:", error);

      // Set error in store
      setError({
        message: errorMessage || "Ein Fehler ist aufgetreten",
        retryable: true,
      });

      // Update assistant message with error
      updateMessage(
        assistantMessageId,
        "Entschuldigung, es gab einen Fehler bei der Verarbeitung deiner Anfrage."
      );
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
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
  };

  return (
    <>
      <ChatHeader
        onMenuClick={onMenuClick}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        selectedVideoModel={selectedVideoModel}
        onVideoModelChange={setSelectedVideoModel}
        mode={mode}
        chatName={chatName}
        onChatNameChange={setChatName}
      />
      {messages.length === 0 ? (
        <ChatWelcome onSendMessage={handleSendMessage} />
      ) : (
        <ChatMessages
          messages={messages}
          isGenerating={isGenerating}
          onEditMessage={handleEditMessage}
          onReplyMessage={handleReplyMessage}
          isSuperChatEnabled={isSuperChatEnabled}
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
      />
    </>
  );
}
