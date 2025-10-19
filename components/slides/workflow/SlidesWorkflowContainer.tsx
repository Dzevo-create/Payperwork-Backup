/**
 * Slides Workflow Container (Chat-based, reusing ChatInput)
 *
 * Main container for slides workflow:
 * - Welcome screen when empty (centered)
 * - Messages area when has messages (scrollable)
 * - ChatInput-style prompt at bottom (always visible)
 * - Preview panel on right (conditional, after approval)
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 4: Chat-based Workflow with Reused Components
 */

'use client';

import React, { useRef, useEffect } from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { SlidesWelcome } from './SlidesWelcome';
import { SlidesMessages } from './SlidesMessages';
import { SlidesPromptInput } from './SlidesPromptInput';
import { SlidesPreviewPanel } from '../preview/SlidesPreviewPanel';

export function SlidesWorkflowContainer() {
  const messages = useSlidesStore((state) => state.messages);
  const showPreview = useSlidesStore((state) => state.showPreview);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const hasMessages = messages.length > 0;

  return (
    <div className="w-full h-full flex gap-6 overflow-hidden">
      {/* Messages Area (left side, flex-1) */}
      <div className={`flex flex-col ${showPreview ? 'flex-1' : 'w-full'} overflow-hidden`}>
        {/* Welcome or Messages */}
        {!hasMessages ? (
          <SlidesWelcome />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <SlidesMessages />
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Prompt Input (fixed bottom) */}
        <div className="flex-shrink-0">
          <SlidesPromptInput />
        </div>
      </div>

      {/* Preview Panel (right side, conditional) */}
      {showPreview && (
        <div className="w-96 flex-shrink-0">
          <SlidesPreviewPanel />
        </div>
      )}
    </div>
  );
}
