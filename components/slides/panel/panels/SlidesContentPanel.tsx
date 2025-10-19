/**
 * Slides Content Panel
 *
 * Shows all generated slides vertically for scrolling (reuse from SlidesPanel).
 *
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import React from 'react';
import { Slide, PresentationFormat, PresentationTheme } from '@/types/slides';
import { FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlidesContentPanelProps {
  slides: Slide[];
  format: PresentationFormat;
  theme: PresentationTheme;
  isGenerating?: boolean;
}

// Aspect ratio mappings
const aspectRatios: Record<string, string> = {
  '16:9': 'aspect-[16/9]',
  '4:3': 'aspect-[4/3]',
  'A4': 'aspect-[1/1.414]',
};

export function SlidesContentPanel({
  slides,
  format,
  theme,
  isGenerating = false,
}: SlidesContentPanelProps) {
  const aspectRatio = aspectRatios[format] || aspectRatios['16:9'];

  // Handle download
  const handleDownloadPDF = () => {
    console.log('Download PDF');
  };

  const handleDownloadPPTX = () => {
    console.log('Download PPTX');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Download Actions (Top Bar) */}
      {slides.length > 0 && (
        <div className="px-4 py-2 border-b border-pw-black/10 bg-pw-black/[0.02] flex items-center justify-between">
          <div className="text-xs text-pw-black/60">
            {slides.length} {slides.length === 1 ? 'Slide' : 'Slides'}
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleDownloadPDF}
              className="px-2 py-1 text-xs bg-pw-black/5 hover:bg-pw-black/10 text-pw-black rounded-md transition-colors flex items-center gap-1"
              title="Als PDF herunterladen"
            >
              <Download className="w-3 h-3" />
              PDF
            </button>
            <button
              onClick={handleDownloadPPTX}
              className="px-2 py-1 text-xs bg-pw-accent hover:bg-pw-accent/90 text-pw-black rounded-md transition-colors flex items-center gap-1"
              title="Als PPTX herunterladen"
            >
              <Download className="w-3 h-3" />
              PPTX
            </button>
          </div>
        </div>
      )}

      {/* Content - All Slides Vertical */}
      <div className="flex-1 overflow-y-auto p-4">
        {slides.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-16 h-16 text-pw-black/20 mb-4" />
            <h3 className="text-sm font-medium text-pw-black/60 mb-2">
              {isGenerating ? 'Slides werden generiert...' : 'Noch keine Slides'}
            </h3>
            <p className="text-xs text-pw-black/40 max-w-xs">
              {isGenerating
                ? 'Die AI erstellt gerade deine Präsentation. Das dauert einen Moment.'
                : 'Erstelle eine Präsentation mit dem Prompt-Input.'}
            </p>
          </div>
        ) : (
          // All Slides Vertical
          <div className="space-y-6">
            {slides.map((slide, index) => (
              <div key={index} className="space-y-2">
                {/* Slide Number */}
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-pw-accent/10 text-pw-accent text-xs font-semibold rounded-md">
                    Slide {slide.order || index + 1}
                  </div>
                  <div className="text-xs text-pw-black/40">{slide.title}</div>
                </div>

                {/* Slide Preview */}
                <div
                  className={cn(
                    'w-full bg-gradient-to-br from-white to-gray-50 rounded-lg border border-pw-black/10 shadow-sm overflow-hidden',
                    aspectRatio
                  )}
                >
                  <div className="h-full p-6 flex flex-col">
                    {/* Slide Title */}
                    <h2 className="text-2xl font-bold text-pw-black mb-4">{slide.title}</h2>

                    {/* Slide Content */}
                    <div className="flex-1 overflow-auto">
                      <div className="prose prose-sm max-w-none">
                        {slide.content.split('\n').map((line, i) => (
                          <p key={i} className="mb-2 text-pw-black/80">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Slide Footer */}
                    <div className="flex items-center justify-between text-xs text-pw-black/40 mt-4">
                      <span>Layout: {slide.layout || 'title_content'}</span>
                      <span>
                        {format} • {theme}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
