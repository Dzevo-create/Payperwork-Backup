"use client";

import React, { useState } from "react";
import { SlidesMessage, SlidesMessageContent, Topic } from "@/types/slides";
import { CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSlidesStore } from "@/hooks/slides/useSlidesStore";
import { useAuth } from "@/contexts/AuthContext";

interface TopicsMessageProps {
  message: SlidesMessage;
}

export function TopicsMessage({ message }: TopicsMessageProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // User Auth
  const { user } = useAuth();

  // Store
  const addMessage = useSlidesStore((state) => state.addMessage);
  const updateMessage = useSlidesStore((state) => state.updateMessage);
  const setCurrentTopics = useSlidesStore((state) => state.setCurrentTopics);
  const setTopicsApproved = useSlidesStore((state) => state.setTopicsApproved);
  const toggleComputerPanel = useSlidesStore((state) => state.toggleComputerPanel);
  const showComputerPanel = useSlidesStore((state) => state.showComputerPanel);
  const setGenerationStatus = useSlidesStore((state) => state.setGenerationStatus);
  const setPanelType = useSlidesStore((state) => state.setPanelType);
  const clearSlides = useSlidesStore((state) => state.clearSlides);
  const format = useSlidesStore((state) => state.format);
  const theme = useSlidesStore((state) => state.theme);
  const currentPrompt = useSlidesStore((state) => state.currentPrompt);
  const currentPresentationId = useSlidesStore((state) => state.currentPresentationId);

  // Extract topics and originalPrompt from message content
  // Handle both old format (array) and new format (object with topics + originalPrompt)
  const messageContent = message.content as SlidesMessageContent;
  const topics: Topic[] = Array.isArray(message.content)
    ? message.content
    : messageContent?.topics || [];
  const originalPrompt = !Array.isArray(message.content)
    ? messageContent?.originalPrompt
    : undefined;

  const handleApprove = async () => {
    setIsApproving(true);

    try {
      // Mark this message as approved
      updateMessage(message.id, { approved: true });
      setTopicsApproved(true);
      setCurrentTopics(topics);

      // OLD PIPELINE: Generate slides after approval
      console.log("🔄 Generating slides with old pipeline...");

      // Add generation message
      const generationMessageId = `msg-gen-${Date.now()}`;
      addMessage({
        id: generationMessageId,
        type: "generation",
        content: "Creating your presentation...",
        timestamp: new Date().toISOString(),
      });

      // Clear previous slides and set panel to 'slides' type
      clearSlides();
      setPanelType("slides");

      // Show Payperwork Panel if not already shown
      if (!showComputerPanel) {
        toggleComputerPanel();
      }
      setGenerationStatus("generating");

      // Validate we have the required data
      if (!currentPresentationId) {
        throw new Error("Presentation ID is missing");
      }
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const userId = user.id;

      // Use originalPrompt from message content, fallback to currentPrompt if needed
      const promptToUse = originalPrompt || currentPrompt;

      if (!promptToUse) {
        throw new Error("Prompt is missing - cannot generate slides");
      }

      // Call API to start generation
      const response = await fetch("/api/slides/workflow/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          topics,
          presentationId: currentPresentationId,
          userId,
          format,
          theme,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      const data = await response.json();

      if (data.success) {
        // WebSocket will handle the rest
        console.log("Slides generation started:", data.presentationId);
      }
    } catch (error) {
      console.error("Error approving topics:", error);

      // Add error message
      addMessage({
        id: `msg-error-${Date.now()}`,
        type: "result",
        content: {
          error: error instanceof Error ? error.message : "Failed to generate slides",
        },
        timestamp: new Date().toISOString(),
      });

      setGenerationStatus("error");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);

    try {
      // Add thinking message
      addMessage({
        id: `msg-thinking-regen-${Date.now()}`,
        type: "thinking",
        content: "Regenerating slide topics...",
        timestamp: new Date().toISOString(),
      });

      // Call API to regenerate topics
      const response = await fetch("/api/slides/workflow/regenerate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, theme }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate topics");
      }

      // WebSocket will handle delivering new topics
    } catch (error) {
      console.error("Error regenerating topics:", error);

      // Add error message
      addMessage({
        id: `msg-error-${Date.now()}`,
        type: "result",
        content: {
          error: error instanceof Error ? error.message : "Failed to regenerate topics",
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const timeString = new Date(message.timestamp || Date.now()).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group flex flex-col items-start pl-12 sm:pl-16 md:pl-24 lg:pl-32">
      {/* Timestamp */}
      <div className="text-pw-black/40 mb-1 px-1 text-left text-[10px]">{timeString}</div>

      {/* Message Bubble */}
      <div className="border-pw-black/10 w-full max-w-3xl rounded-2xl border bg-white/90 px-4 py-4 text-pw-black shadow-sm sm:px-6 sm:py-5">
        <h3 className="mb-3 text-sm font-semibold">Vorgeschlagene Folien:</h3>

        <ol className="mb-4 list-inside list-decimal space-y-3">
          {topics.map((topic, index) => (
            <li key={topic.order || index} className="text-sm leading-relaxed text-pw-black">
              <div className="ml-2 inline-block">
                <div className="font-medium">{topic.title}</div>
                <div className="text-pw-black/60 mt-0.5 text-xs">{topic.description}</div>
              </div>
            </li>
          ))}
        </ol>

        {!message.approved && (
          <div className="border-pw-black/10 flex gap-2 border-t pt-2">
            <Button
              onClick={handleApprove}
              className="flex-1"
              disabled={isApproving || isRegenerating}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isApproving ? "Wird gestartet..." : "Bestätigen & Erstellen"}
            </Button>
            <Button
              onClick={handleRegenerate}
              variant="outline"
              disabled={isApproving || isRegenerating}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
              Neu generieren
            </Button>
          </div>
        )}

        {message.approved && (
          <div className="border-pw-black/10 flex items-center gap-2 border-t pt-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <p className="text-sm font-medium">Bestätigt - Erstellung gestartet</p>
          </div>
        )}
      </div>
    </div>
  );
}
