/**
 * Live Slide Preview (Refactored)
 * 
 * Shows slides in real-time with navigation.
 * Now much smaller (~120 lines) by extracting navigation and container logic.
 * 
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Slide, PresentationFormat, PresentationTheme } from '@/types/slides';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Maximize2, Download, Loader2 } from 'lucide-react';

// Import extracted modules
import SlideCanvas from './SlideCanvas.refactored';
import { SlideNavigation } from './navigation/SlideNavigation';
import { SlidePreviewContainer } from './preview/SlidePreviewContainer';

interface LiveSlidePreviewProps {
  slides: Slide[];
  format: PresentationFormat;
  theme: PresentationTheme;
  isGenerating?: boolean;
  onSlideClick?: (slide: Slide, index: number) => void;
  onExport?: (format: 'pdf' | 'pptx') => void;
  className?: string;
}

export function LiveSlidePreview({
  slides,
  format,
  theme,
  isGenerating = false,
  onSlideClick,
  onExport,
  className,
}: LiveSlidePreviewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentSlide = slides[currentSlideIndex];

  // ============================================
  // Keyboard Navigation
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      if (e.key === 'ArrowRight') setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
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
      <div className={`h-full flex items-center justify-center ${className || ''}`}>
        <Card className="p-8 text-center max-w-md">
          {isGenerating ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <h3 className="text-lg font-semibold mb-2">Slides werden generiert...</h3>
              <p className="text-sm text-muted-foreground">
                Die AI erstellt gerade deine Präsentation.
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
    <div className={`h-full flex flex-col bg-background ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''} ${className || ''}`}>
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
          <Button size="sm" variant="ghost" onClick={() => setIsFullscreen(!isFullscreen)}>
            <Maximize2 className="w-4 h-4" />
          </Button>
          {onExport && (
            <Button size="sm" variant="ghost" onClick={() => onExport('pdf')}>
              <Download className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Slide Container */}
      <SlidePreviewContainer format={format} className="flex-1 p-8 overflow-hidden">
        {currentSlide && (
          <SlideCanvas
            slide={currentSlide}
            format={format}
            theme={theme}
            className="shadow-2xl"
          />
        )}
      </SlidePreviewContainer>

      {/* Navigation */}
      <SlideNavigation
        slides={slides}
        currentIndex={currentSlideIndex}
        onNavigate={setCurrentSlideIndex}
      />

      {/* Generating Indicator */}
      {isGenerating && (
        <div className="absolute bottom-20 right-8 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">Generating slide {slides.length + 1}...</span>
        </div>
      )}
    </div>
  );
}

