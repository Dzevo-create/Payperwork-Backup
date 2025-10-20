/**
 * Slide Canvas (Refactored)
 * 
 * Main component for rendering individual slides.
 * Now much smaller (~80 lines) by extracting layouts and themes.
 * 
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import { forwardRef } from 'react';
import { Slide, PresentationTheme, PresentationFormat } from '@/types/slides';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Import extracted modules
import { SlideLayoutRenderer } from './renderers/SlideLayoutRenderer';
import { getThemeColors, getAspectRatioClass } from './config/slideThemes';

interface SlideCanvasProps {
  slide: Slide;
  theme: PresentationTheme;
  format: PresentationFormat;
  isEditable?: boolean;
  onUpdate?: (slide: Slide) => void;
  className?: string;
}

const SlideCanvas = forwardRef<HTMLDivElement, SlideCanvasProps>(
  ({ slide, theme, format, isEditable = false, onUpdate, className }, ref) => {
    // Get theme colors and aspect ratio
    const colors = getThemeColors(theme);
    const aspectRatio = getAspectRatioClass(format);

    return (
      <Card
        ref={ref}
        className={cn(
          'w-full shadow-lg overflow-hidden relative',
          aspectRatio, // Enforce aspect ratio
          className
        )}
      >
        {/* Slide Content - Rendered by Layout Renderer */}
        <SlideLayoutRenderer slide={slide} colors={colors} />

        {/* Slide Number Badge (Bottom Right) */}
        <Badge 
          variant="secondary" 
          className="absolute bottom-4 right-4 opacity-50"
        >
          {slide.order_index || slide.order || 1}
        </Badge>

        {/* Speaker Notes Indicator (Bottom Left) */}
        {slide.speaker_notes && (
          <Badge 
            variant="outline" 
            className="absolute bottom-4 left-4 opacity-50"
          >
            📝 Notes
          </Badge>
        )}
      </Card>
    );
  }
);

SlideCanvas.displayName = 'SlideCanvas';

export default SlideCanvas;

