/**
 * Slides Workflow Container
 *
 * Main container combining all workflow components.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

'use client';

import React from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { SlidesPromptInput } from './SlidesPromptInput';
import { ThinkingDisplay } from '../thinking/ThinkingDisplay';
import { SlidesPreviewPanel } from '../preview/SlidesPreviewPanel';
import { SlidesResultDisplay } from './SlidesResultDisplay';

export function SlidesWorkflowContainer() {
  const generationStatus = useSlidesStore((state) => state.generationStatus);
  const finalPresentation = useSlidesStore((state) => state.finalPresentation);

  return (
    <div className="w-full h-full flex gap-6">
      <div className="flex-1 flex flex-col gap-6 overflow-auto">
        <SlidesPromptInput />

        {(generationStatus === 'thinking' || generationStatus === 'generating') && (
          <ThinkingDisplay />
        )}

        {generationStatus === 'completed' && finalPresentation && <SlidesResultDisplay />}
      </div>

      <div className="w-96 flex-shrink-0">
        <SlidesPreviewPanel />
      </div>
    </div>
  );
}
