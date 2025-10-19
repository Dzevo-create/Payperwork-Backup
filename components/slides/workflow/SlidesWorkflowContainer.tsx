/**
 * Slides Workflow Container (Chat-based)
 *
 * Main container for the chat-based slides workflow.
 * Layout similar to ChatArea with Messages + conditional Preview Panel.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 4: Chat-based Workflow UI
 */

'use client';

import React from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { SlidesMessageList } from './SlidesMessageList';
import { SlidesPromptInput } from './SlidesPromptInput';
import { SlidesPreviewPanel } from '../preview/SlidesPreviewPanel';

export function SlidesWorkflowContainer() {
  const showPreview = useSlidesStore((state) => state.showPreview);

  return (
    <div className="w-full h-full flex gap-6 overflow-hidden">
      {/* Messages Area (left side, flex-1) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages List (scrollable) */}
        <SlidesMessageList />

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
