"use client";

import { useState, useRef } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatWelcome } from "./ChatWelcome";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: {
    type: "image" | "pdf";
    url: string;
    name: string;
    pdfText?: string;
  }[];
}

interface ChatAreaProps {
  onMenuClick?: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function ChatArea({ onMenuClick, messages, setMessages }: ChatAreaProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    // Add user message (without PDF text - that's only sent to API)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content, // Just the user's actual message
      timestamp: new Date(),
      attachments: attachments || [],
    };

    setMessages((prev) => [...prev, userMessage]);

    // Create assistant message placeholder for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // Create AbortController for this request
    abortControllerRef.current = new AbortController();
    setIsGenerating(true);

    try {
      // Call OpenAI API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
            attachments: msg.attachments,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to get response from API");
      }

      // Handle streaming response with batching (ChatGPT-style)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let accumulatedContent = "";
      let updateScheduled = false;

      // Batch updates with requestAnimationFrame for smooth rendering
      const scheduleUpdate = () => {
        if (!updateScheduled) {
          updateScheduled = true;
          requestAnimationFrame(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: accumulatedContent }
                  : msg
              )
            );
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
              accumulatedContent += parsed.content;

              // Schedule batched update instead of immediate update
              scheduleUpdate();
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Final update to ensure all content is displayed
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: accumulatedContent }
            : msg
        )
      );
      setIsGenerating(false);
      abortControllerRef.current = null;
    } catch (error: any) {
      setIsGenerating(false);
      abortControllerRef.current = null;

      // Handle abort
      if (error.name === "AbortError") {
        console.log("Generation stopped by user");
        return;
      }

      console.error("Error calling OpenAI API:", error);
      // Update assistant message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Entschuldigung, es gab einen Fehler bei der Verarbeitung deiner Anfrage." }
            : msg
        )
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
      <ChatHeader onMenuClick={onMenuClick} />
      {messages.length === 0 ? (
        <ChatWelcome onSendMessage={handleSendMessage} />
      ) : (
        <ChatMessages
          messages={messages}
          isGenerating={isGenerating}
          onEditMessage={handleEditMessage}
        />
      )}
      <ChatInput
        onSendMessage={handleSendMessage}
        isGenerating={isGenerating}
        onStopGeneration={handleStopGeneration}
      />
    </>
  );
}
