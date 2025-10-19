/**
 * Live Slide Preview
 *
 * Renders a single slide in preview.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

'use client';

import React from 'react';
import { LivePreviewSlide } from '@/types/slides';
import { SlideRenderer } from '../shared/SlideRenderer';
import { Badge } from '@/components/ui/badge';

interface LiveSlidePreviewProps {
  slide: LivePreviewSlide;
}

export function LiveSlidePreview({ slide }: LiveSlidePreviewProps) {
  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <Badge variant="secondary">Slide {slide.order_index + 1}</Badge>
        <span className="text-xs text-muted-foreground">{slide.layout}</span>
      </div>

      <div className="flex-1 border rounded-lg overflow-auto bg-white">
        <SlideRenderer slide={slide} />
      </div>
    </div>
  );
}
