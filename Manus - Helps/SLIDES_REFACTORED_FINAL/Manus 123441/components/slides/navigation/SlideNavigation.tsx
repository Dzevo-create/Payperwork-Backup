/**
 * Slide Navigation Component
 * 
 * Navigation controls for slide preview (Prev/Next/Thumbnails).
 * Extracted from LiveSlidePreview for better maintainability.
 * 
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Slide } from '@/types/slides';

interface SlideNavigationProps {
  slides: Slide[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export function SlideNavigation({ slides, currentIndex, onNavigate }: SlideNavigationProps) {
  const goToPrev = () => onNavigate(Math.max(0, currentIndex - 1));
  const goToNext = () => onNavigate(Math.min(slides.length - 1, currentIndex + 1));

  return (
    <div className="px-4 py-3 border-t bg-card flex items-center justify-between">
      {/* Previous Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={goToPrev}
        disabled={currentIndex === 0}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Previous
      </Button>

      {/* Slide Thumbnails */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-xl">
        {slides.map((slide, index) => (
          <button
            key={slide.id || index}
            onClick={() => onNavigate(index)}
            className={cn(
              'flex-shrink-0 w-16 h-10 rounded border-2 transition-all',
              index === currentIndex
                ? 'border-primary shadow-md scale-110'
                : 'border-border hover:border-primary/50 opacity-60 hover:opacity-100'
            )}
            title={`Slide ${index + 1}: ${slide.title}`}
          >
            <div className="w-full h-full bg-muted rounded flex items-center justify-center text-xs font-medium">
              {index + 1}
            </div>
          </button>
        ))}
      </div>

      {/* Next Button */}
      <Button
        size="sm"
        variant="outline"
        onClick={goToNext}
        disabled={currentIndex === slides.length - 1}
      >
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

