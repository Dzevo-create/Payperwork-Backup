'use client';

import React, { useState } from 'react';
import { SlidesMessage, SlidesMessageContent } from '@/types/slides';
import { Bot, CheckCircle, RefreshCw } from 'lucide-react';
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

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <div className="bg-muted rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-sm">Proposed Slide Topics:</h3>

          <ol className="list-decimal list-inside space-y-2 mb-4">
            {topics.map((topic, index) => (
              <li key={index} className="text-sm text-foreground">
                {topic}
              </li>
            ))}
          </ol>

          {!message.approved && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={handleApprove}
                className="flex-1"
                disabled={isApproving || isRegenerating}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isApproving ? 'Starting...' : 'Approve & Generate'}
              </Button>
              <Button
                onClick={handleRegenerate}
                variant="outline"
                disabled={isApproving || isRegenerating}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>
          )}

          {message.approved && (
            <div className="flex items-center gap-2 pt-2 border-t text-green-600">
              <CheckCircle className="w-4 h-4" />
              <p className="text-sm font-medium">Approved - Generation started</p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
