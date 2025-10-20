/**
 * Live Slide Preview with Aspect Ratio Enforcement
 * 
 * Shows slides as they are generated in real-time.
 * Enforces correct aspect ratio regardless of container size.
 * 
 * Features:
 * - Real-time slide updates
 * - Aspect ratio container (scales to fit)
 * - Smooth transitions
 * - Loading states
 * - Navigation between slides
 * 
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Slide, PresentationFormat, PresentationTheme } from '@/types/slides';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Maximize2, Download, Loader2 } from 'lucide-react';
import SlideCanvas from './SlideCanvas.improved';

interface LiveSlidePreviewProps {
  slides: Slide[];
  format: PresentationFormat;
  theme: PresentationTheme;
  isGenerating?: boolean;
  onSlideClick?: (slide: Slide, index: number) => void;
  className?: string;
}

// Aspect Ratio Values (for calculation)
const ASPECT_RATIO_VALUES: Record<PresentationFormat, number> = {
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  'A4': 210 / 297,
};

export function LiveSlidePreview({
  slides,
  format,
  theme,
  isGenerating = false,
  onSlideClick,
  className,
}: LiveSlidePreviewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const currentSlide = slides[currentSlideIndex];
  const aspectRatio = ASPECT_RATIO_VALUES[format];

  // ============================================
  // Calculate Container Size
  // ============================================
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // ============================================
  // Calculate Slide Dimensions (fit to container)
  // ============================================
  const getSlideSize = () => {
    const { width: containerWidth, height: containerHeight } = containerSize;

    if (!containerWidth || !containerHeight) {
      return { width: 800, height: 450 }; // Default 16:9
    }

    // Calculate based on aspect ratio
    const containerAspect = containerWidth / containerHeight;

    if (containerAspect > aspectRatio) {
      // Container is wider - fit to height
      const height = containerHeight;
      const width = height * aspectRatio;
      return { width, height };
    } else {
      // Container is taller - fit to width
      const width = containerWidth;
      const height = width / aspectRatio;
      return { width, height };
    }
  };

  const slideSize = getSlideSize();

  // ============================================
  // Navigation
  // ============================================
  const goToPrevSlide = () => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextSlide = () => {
    setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlideIndex(Math.max(0, Math.min(slides.length - 1, index)));
  };

  // ============================================
  // Keyboard Navigation
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevSlide();
      if (e.key === 'ArrowRight') goToNextSlide();
      if (e.key === 'Escape') setIsFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  // ============================================
  // Auto-advance to latest slide when generating
  // ============================================
  useEffect(() => {
    if (isGenerating && slides.length > 0) {
      setCurrentSlideIndex(slides.length - 1);
    }
  }, [slides.length, isGenerating]);

  // ============================================
  // Empty State
  // ============================================
  if (slides.length === 0) {
    return (
      <div className={cn('h-full flex items-center justify-center', className)}>
        <Card className="p-8 text-center max-w-md">
          {isGenerating ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <h3 className="text-lg font-semibold mb-2">Slides werden generiert...</h3>
              <p className="text-sm text-muted-foreground">
                Die AI erstellt gerade deine Präsentation. Das dauert einen Moment.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                📊
              </div>
              <h3 className="text-lg font-semibold mb-2">Noch keine Slides</h3>
              <p className="text-sm text-muted-foreground">
                Erstelle eine Präsentation mit dem Prompt-Input.
              </p>
            </>
          )}
        </Card>
      </div>
    );
  }

  // ============================================
  // Main Render
  // ============================================
  return (
    <div 
      className={cn(
        'h-full flex flex-col bg-background',
        isFullscreen && 'fixed inset-0 z-50 bg-black',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {currentSlideIndex + 1} / {slides.length}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {format} • {theme}
          </span>
          {isGenerating && (
            <Badge variant="default" className="animate-pulse">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Generating...
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Slide Container (Aspect Ratio Enforced) */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-8 overflow-hidden"
      >
        <div
          style={{
            width: `${slideSize.width}px`,
            height: `${slideSize.height}px`,
            maxWidth: '100%',
            maxHeight: '100%',
          }}
          className="relative transition-all duration-300"
        >
          {currentSlide && (
            <SlideCanvas
              slide={currentSlide}
              format={format}
              theme={theme}
              className="shadow-2xl"
            />
          )}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="px-4 py-3 border-t bg-card flex items-center justify-between">
        {/* Previous Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={goToPrevSlide}
          disabled={currentSlideIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        {/* Slide Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-xl">
          {slides.map((slide, index) => (
            <button
              key={slide.id || index}
              onClick={() => goToSlide(index)}
              className={cn(
                'flex-shrink-0 w-16 h-10 rounded border-2 transition-all',
                index === currentSlideIndex
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
          onClick={goToNextSlide}
          disabled={currentSlideIndex === slides.length - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Generating Indicator (Overlay) */}
      {isGenerating && (
        <div className="absolute bottom-20 right-8 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">
            Generating slide {slides.length + 1}...
          </span>
        </div>
      )}
    </div>
  );
}

