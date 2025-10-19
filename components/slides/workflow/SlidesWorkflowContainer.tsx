/**
 * Slides Workflow Container (Chat-based, 1:1 wie ChatInput)
 *
 * Main container for slides workflow:
 * - Welcome screen when empty (centered)
 * - Messages area when has messages (scrollable)
 * - ChatInput at bottom (EXACTLY like in chat, with Settings button integrated)
 * - Preview panel on right (conditional, after approval)
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 4: ChatInput Integration (1:1)
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { useUser } from '@/hooks/useUser';
import { SlidesWelcome } from './SlidesWelcome';
import { SlidesMessages } from './SlidesMessages';
import { SlidesPreviewPanel } from '../preview/SlidesPreviewPanel';
import { SlidesComputerPanel } from '../computer/SlidesComputerPanel';
import { AgentStatusIndicator } from '../AgentStatusIndicator';
import { SlidesInput } from './SlidesInput';

export function SlidesWorkflowContainer() {
  const messages = useSlidesStore((state) => state.messages);
  const showPreview = useSlidesStore((state) => state.showPreview);
  const currentPrompt = useSlidesStore((state) => state.currentPrompt);
  const setCurrentPrompt = useSlidesStore((state) => state.setCurrentPrompt);
  const generationStatus = useSlidesStore((state) => state.generationStatus);
  const addMessage = useSlidesStore((state) => state.addMessage);
  const setGenerationStatus = useSlidesStore((state) => state.setGenerationStatus);
  const format = useSlidesStore((state) => state.format);
  const setFormat = useSlidesStore((state) => state.setFormat);
  const theme = useSlidesStore((state) => state.theme);
  const setTheme = useSlidesStore((state) => state.setTheme);
  const setCurrentTopics = useSlidesStore((state) => state.setCurrentTopics);
  const addPresentation = useSlidesStore((state) => state.addPresentation);

  // NEW: Phase 2 - Computer Panel
  const toolHistory = useSlidesStore((state) => state.toolHistory);
  const showComputerPanel = useSlidesStore((state) => state.showComputerPanel);
  const toggleComputerPanel = useSlidesStore((state) => state.toggleComputerPanel);

  // Final Slides (for Computer Panel)
  const finalSlides = useSlidesStore((state) => state.finalSlides);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [currentPrompt]);

  // Removed polling - using WebSocket updates from webhook handler instead

  const handleSendMessage = async () => {
    if (!currentPrompt.trim()) return;

    const message = currentPrompt.trim();

    // Store prompt BEFORE clearing input
    const setStoredCurrentPrompt = useSlidesStore.getState().setCurrentPrompt;
    setStoredCurrentPrompt(message);

    setCurrentPrompt('');

    // Add user message
    addMessage({
      id: `msg-user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    setGenerationStatus('thinking');

    // Call API to generate topics
    try {
      // Get userId from useUser hook
      const { user } = useUser();
      const userId = user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Step 1: Generate AI acknowledgment message
      const ackResponse = await fetch('/api/slides/workflow/generate-acknowledgment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message }),
      });

      const ackData = await ackResponse.json();
      const acknowledgment = ackData.acknowledgment || 'Okay, ich erstelle dir einen Vorschlag für die Präsentation.';

      // Add AI-generated thinking message
      addMessage({
        id: `msg-thinking-${Date.now()}`,
        type: 'thinking',
        content: acknowledgment,
        timestamp: new Date().toISOString(),
      });

      // Step 2: Generate topics
      const response = await fetch('/api/slides/workflow/generate-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message, format, theme, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate topics');
      }

      const data = await response.json();

      // Store presentationId when we get it back
      if (data.success && data.presentationId) {
        const setStoredPresentationId = useSlidesStore.getState().setCurrentPresentationId;
        setStoredPresentationId(data.presentationId);
        console.log('✅ Topic generation started, presentationId:', data.presentationId);

        // Add new presentation to sidebar
        addPresentation({
          id: data.presentationId,
          prompt: message,
          status: 'topics_generated',
          created_at: new Date().toISOString(),
        });

        // Display topics immediately (no WebSocket needed)
        if (data.topics && Array.isArray(data.topics) && data.topics.length > 0) {
          // Store topics in store (for TopicsMessage to access)
          setCurrentTopics(data.topics);

          addMessage({
            id: `msg-topics-${Date.now()}`,
            type: 'topics',
            content: data.topics,
            timestamp: new Date().toISOString(),
          });
          setGenerationStatus('idle');
        }
      }
    } catch (error) {
      console.error('Error generating topics:', error);

      // Add error message
      addMessage({
        id: `msg-error-${Date.now()}`,
        type: 'result',
        content: {
          error: error instanceof Error ? error.message : 'Failed to generate topics',
        },
        timestamp: new Date().toISOString(),
      });

      setGenerationStatus('error');
    }
  };

  const hasMessages = messages.length > 0;
  const isGenerating =
    generationStatus === 'thinking' || generationStatus === 'generating';

  return (
    <div className="w-full h-full flex gap-6 overflow-hidden">
      {/* Messages Area (left/center) */}
      <div
        className={`flex flex-col ${showPreview || showComputerPanel ? 'flex-1' : 'w-full'} overflow-hidden`}
      >
        {/* Welcome or Messages */}
        {!hasMessages ? (
          <SlidesWelcome />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <SlidesMessages />
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Agent Status Indicator */}
        {hasMessages && (
          <div className="px-3 sm:px-4 md:px-6">
            <div className="max-w-3xl mx-auto">
              <AgentStatusIndicator />
            </div>
          </div>
        )}

        {/* Slides Input (2-Row Layout with Prompt Generator) */}
        <SlidesInput
          currentPrompt={currentPrompt}
          setCurrentPrompt={setCurrentPrompt}
          onSend={handleSendMessage}
          isGenerating={isGenerating}
          format={format}
          setFormat={setFormat}
          theme={theme}
          setTheme={setTheme}
          showComputerPanel={showComputerPanel}
          toggleComputerPanel={toggleComputerPanel}
          toolHistory={toolHistory}
        />
      </div>

      {/* Preview Panel (right side, conditional) */}
      {showPreview && (
        <div className="w-96 flex-shrink-0">
          <SlidesPreviewPanel />
        </div>
      )}

      {/* Slides Computer Panel (right side, conditional) - Toggled by Monitor Button */}
      {showComputerPanel && (
        <div className="flex-1 min-w-[500px] max-w-[700px] flex-shrink-0">
          <SlidesComputerPanel
            slides={finalSlides}
            isGenerating={isGenerating}
            format={format}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
}
