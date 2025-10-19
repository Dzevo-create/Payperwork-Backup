'use client';

import React, { useState } from 'react';
import { SlidesMessage, SlidesMessageContent } from '@/types/slides';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';

interface TopicsMessageProps {
  message: SlidesMessage;
}

export function TopicsMessage({ message }: TopicsMessageProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const addMessage = useSlidesStore((state) => state.addMessage);
  const updateMessage = useSlidesStore((state) => state.updateMessage);
  const setCurrentTopics = useSlidesStore((state) => state.setCurrentTopics);
  const setTopicsApproved = useSlidesStore((state) => state.setTopicsApproved);
  const setShowPreview = useSlidesStore((state) => state.setShowPreview);
  const setGenerationStatus = useSlidesStore((state) => state.setGenerationStatus);
  const format = useSlidesStore((state) => state.format);
  const theme = useSlidesStore((state) => state.theme);

  // Extract topics from message content
  const topics: string[] = Array.isArray(message.content)
    ? message.content
    : (message.content as SlidesMessageContent)?.topics || [];

  const handleApprove = async () => {
    setIsApproving(true);

    try {
      // Mark this message as approved
      updateMessage(message.id, { approved: true });
      setTopicsApproved(true);
      setCurrentTopics(topics);

      // Add generation message
      const generationMessageId = `msg-gen-${Date.now()}`;
      addMessage({
        id: generationMessageId,
        type: 'generation',
        content: 'Creating your presentation...',
        timestamp: new Date().toISOString(),
      });

      // Show preview panel
      setShowPreview(true);
      setGenerationStatus('generating');

      // Call API to start generation
      const response = await fetch('/api/slides/workflow/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics, format, theme }),
      });

      if (!response.ok) {
        throw new Error('Failed to start generation');
      }

      const data = await response.json();

      if (data.success) {
        // WebSocket will handle the rest
        console.log('Slides generation started:', data.presentationId);
      }
    } catch (error) {
      console.error('Error approving topics:', error);

      // Add error message
      addMessage({
        id: `msg-error-${Date.now()}`,
        type: 'result',
        content: {
          error: error instanceof Error ? error.message : 'Failed to generate slides',
        },
        timestamp: new Date().toISOString(),
      });

      setGenerationStatus('error');
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
        type: 'thinking',
        content: 'Regenerating slide topics...',
        timestamp: new Date().toISOString(),
      });

      // Call API to regenerate topics
      const response = await fetch('/api/slides/workflow/regenerate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, theme }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate topics');
      }

      // WebSocket will handle delivering new topics
    } catch (error) {
      console.error('Error regenerating topics:', error);

      // Add error message
      addMessage({
        id: `msg-error-${Date.now()}`,
        type: 'result',
        content: {
          error: error instanceof Error ? error.message : 'Failed to regenerate topics',
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
      <div className="text-[10px] text-pw-black/40 mb-1 px-1 text-left">
        {timeString}
      </div>

      {/* Message Bubble */}
      <div className="max-w-3xl w-full px-4 sm:px-6 py-4 sm:py-5 bg-white/90 border border-pw-black/10 text-pw-black shadow-sm rounded-2xl">
        <h3 className="font-semibold mb-3 text-sm">Vorgeschlagene Folien:</h3>

        <ol className="list-decimal list-inside space-y-2 mb-4">
          {topics.map((topic, index) => (
            <li key={index} className="text-sm text-pw-black leading-relaxed">
              {topic}
            </li>
          ))}
        </ol>

        {!message.approved && (
          <div className="flex gap-2 pt-2 border-t border-pw-black/10">
            <Button
              onClick={handleApprove}
              className="flex-1"
              disabled={isApproving || isRegenerating}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {isApproving ? 'Wird gestartet...' : 'Bestätigen & Erstellen'}
            </Button>
            <Button
              onClick={handleRegenerate}
              variant="outline"
              disabled={isApproving || isRegenerating}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
              Neu generieren
            </Button>
          </div>
        )}

        {message.approved && (
          <div className="flex items-center gap-2 pt-2 border-t border-pw-black/10 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <p className="text-sm font-medium">Bestätigt - Erstellung gestartet</p>
          </div>
        )}
      </div>
    </div>
  );
}
