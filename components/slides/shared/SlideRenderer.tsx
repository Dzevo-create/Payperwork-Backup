/**
 * Slide Renderer
 *
 * Renders slide content with proper formatting.
 * Supports Markdown rendering.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

'use client';

import React from 'react';
import { Slide, LivePreviewSlide } from '@/types/slides';
import ReactMarkdown from 'react-markdown';

interface SlideRendererProps {
  slide: Slide | LivePreviewSlide;
}

export function SlideRenderer({ slide }: SlideRendererProps) {
  return (
    <div className="w-full h-full p-8 flex flex-col">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold">{slide.title}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 prose prose-sm max-w-none">
        <ReactMarkdown>{slide.content}</ReactMarkdown>
      </div>

      {/* Slide Number (bottom right) */}
      <div className="text-right text-sm text-muted-foreground mt-4">
        {slide.order_index + 1}
      </div>
    </div>
  );
}
