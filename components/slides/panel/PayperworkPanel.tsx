/**
 * Payperwork Panel - Modular Dynamic Panel Container
 *
 * One container that dynamically loads different panel components based on task/context.
 *
 * Architecture:
 * - Slides Panel: Shows presentation slides (like Manus.im preview)
 * - Tools Panel: Shows AI tool usage (like Manus.im computer tab)
 * - Thinking Panel: Shows agent reasoning/thinking steps
 *
 * @author Payperwork Team
 * @date 2025-10-20
 * @phase Phase 2: Modular Panel Architecture
 */

'use client';

import React from 'react';
import { Monitor } from 'lucide-react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { PanelType } from '@/hooks/slides/slices/toolSlice';
import { cn } from '@/lib/utils';

// Import panel components
import { SlidesContentPanel } from './panels/SlidesContentPanel';
import { ToolsContentPanel } from './panels/ToolsContentPanel';
import { ThinkingContentPanel } from './panels/ThinkingContentPanel';

interface PayperworkPanelProps {
  isGenerating?: boolean;
}

export function PayperworkPanel({ isGenerating = false }: PayperworkPanelProps) {
  const currentPanelType = useSlidesStore((state) => state.currentPanelType);
  const toolHistory = useSlidesStore((state) => state.toolHistory);
  const slides = useSlidesStore((state) => state.slides);
  const generationStatus = useSlidesStore((state) => state.generationStatus);
  const format = useSlidesStore((state) => state.format);
  const theme = useSlidesStore((state) => state.theme);
  const thinkingSteps = useSlidesStore((state) => state.thinkingSteps);

  // Get panel title based on type
  const getPanelTitle = (): string => {
    switch (currentPanelType) {
      case 'slides':
        return 'Slides';
      case 'tools':
        return 'Computer';
      case 'thinking':
        return 'Thinking';
      default:
        return 'Payperwork';
    }
  };

  // Render content based on panel type
  const renderPanelContent = () => {
    switch (currentPanelType) {
      case 'slides':
        return (
          <SlidesContentPanel
            slides={slides}
            format={format}
            theme={theme}
            isGenerating={generationStatus === 'generating'}
          />
        );
      case 'tools':
        return <ToolsContentPanel toolActions={toolHistory} />;
      case 'thinking':
        return <ThinkingContentPanel steps={thinkingSteps} isGenerating={isGenerating} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Monitor className="w-16 h-16 text-pw-black/20 mb-4" />
            <h3 className="text-sm font-medium text-pw-black/60 mb-2">
              Payperwork Panel
            </h3>
            <p className="text-xs text-pw-black/40 max-w-xs">
              Die AI wird verschiedene Panels hier anzeigen basierend auf der Aufgabe.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border border-pw-black/10 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-pw-black/10 bg-gradient-to-r from-pw-black/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-pw-accent" />
            <h2 className="text-lg font-semibold text-pw-black">{getPanelTitle()}</h2>
          </div>
          {isGenerating && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-pw-accent rounded-full animate-pulse" />
              <span className="text-xs text-pw-black/60">Läuft...</span>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Content */}
      <div className="flex-1 overflow-hidden">{renderPanelContent()}</div>
    </div>
  );
}
