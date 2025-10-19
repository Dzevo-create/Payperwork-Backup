/**
 * Slides Computer Panel
 *
 * Shows slides preview and code view with aspect ratio support.
 * Similar styling to ResultsPanel with wider layout (500-700px).
 */

'use client';

import { useState } from 'react';
import { Monitor, Eye, Code2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Slide {
  order: number;
  title: string;
  content: string;
  layout?: string;
}

interface SlidesComputerPanelProps {
  slides: Slide[];
  isGenerating?: boolean;
  format?: string;
  theme?: string;
}

// Aspect ratio mappings
const aspectRatios: Record<string, string> = {
  '16:9': 'aspect-[16/9]',
  '4:3': 'aspect-[4/3]',
  'A4': 'aspect-[1/1.414]',
};

export function SlidesComputerPanel({
  slides,
  isGenerating = false,
  format = '16:9',
  theme = 'default',
}: SlidesComputerPanelProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const currentSlide = slides[currentSlideIndex];
  const hasSlides = slides.length > 0;
  const aspectRatio = aspectRatios[format] || aspectRatios['16:9'];

  const goToPrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-pw-black/10 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-pw-black/10 bg-gradient-to-r from-pw-black/5 to-transparent">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-pw-accent" />
          <h2 className="text-lg font-semibold text-pw-black">
            Payperwork
          </h2>
        </div>
        {isGenerating && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-pw-accent rounded-full animate-pulse" />
            <span className="text-xs text-pw-black/60">Generiert...</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-pw-black/10">
        <button
          onClick={() => setActiveTab('preview')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'preview'
              ? 'text-pw-accent border-b-2 border-pw-accent'
              : 'text-pw-black/60 hover:text-pw-black'
          )}
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'code'
              ? 'text-pw-accent border-b-2 border-pw-accent'
              : 'text-pw-black/60 hover:text-pw-black'
          )}
        >
          <Code2 className="w-4 h-4" />
          Code
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {!hasSlides ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Monitor className="w-12 h-12 text-pw-black/20 mb-4" />
            <p className="text-sm text-pw-black/60">
              Keine Folien generiert
            </p>
            <p className="text-xs text-pw-black/40 mt-1">
              Starten Sie die Generierung, um Folien hier zu sehen
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'preview' && currentSlide && (
              <div className="space-y-4">
                {/* Slide Preview with Aspect Ratio */}
                <div className="w-full">
                  <div
                    className={cn(
                      'w-full bg-gradient-to-br from-white to-gray-50 rounded-lg border border-pw-black/10 shadow-sm overflow-hidden',
                      aspectRatio
                    )}
                  >
                    <div className="h-full p-6 flex flex-col">
                      {/* Slide Title */}
                      <h2 className="text-2xl font-bold text-pw-black mb-4">
                        {currentSlide.title}
                      </h2>

                      {/* Slide Content */}
                      <div className="flex-1 overflow-auto">
                        <div className="prose prose-sm max-w-none">
                          {currentSlide.content.split('\n').map((line, i) => (
                            <p key={i} className="mb-2 text-pw-black/80">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Slide Number */}
                      <div className="text-xs text-pw-black/40 mt-4 text-right">
                        Folie {currentSlide.order} / {slides.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slide Info */}
                <div className="flex items-center justify-between text-xs text-pw-black/60">
                  <div className="flex items-center gap-2">
                    <span>Format: {format}</span>
                    <span className="w-1 h-1 bg-pw-black/20 rounded-full" />
                    <span>Theme: {theme}</span>
                    <span className="w-1 h-1 bg-pw-black/20 rounded-full" />
                    <span>Layout: {currentSlide.layout || 'title_content'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'code' && (
              <div className="space-y-2">
                {/* Code View */}
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{JSON.stringify(slides, null, 2)}</code>
                </pre>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-pw-black/60">
                  <span>Total Folien: {slides.length}</span>
                  <span className="w-1 h-1 bg-pw-black/20 rounded-full" />
                  <span>Format: {format}</span>
                  <span className="w-1 h-1 bg-pw-black/20 rounded-full" />
                  <span>Theme: {theme}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation (only in preview mode with slides) */}
      {hasSlides && activeTab === 'preview' && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-pw-black/10">
          <button
            onClick={goToPrevious}
            disabled={currentSlideIndex === 0}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors',
              currentSlideIndex === 0
                ? 'text-pw-black/30 cursor-not-allowed'
                : 'text-pw-black/60 hover:text-pw-black hover:bg-pw-black/5'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Vorherige
          </button>

          <span className="text-sm font-medium text-pw-black/80">
            {currentSlideIndex + 1} / {slides.length}
          </span>

          <button
            onClick={goToNext}
            disabled={currentSlideIndex === slides.length - 1}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors',
              currentSlideIndex === slides.length - 1
                ? 'text-pw-black/30 cursor-not-allowed'
                : 'text-pw-black/60 hover:text-pw-black hover:bg-pw-black/5'
            )}
          >
            Nächste
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
