/**
 * Slides Content Panel (Refactored)
 * 
 * Shows slides in Payperwork Panel.
 * Now much smaller (~150 lines) by using extracted components.
 * 
 * INTEGRATION: Wird in PayperworkPanel.tsx verwendet!
 * 
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import React, { useState } from 'react';
import { Slide, PresentationFormat, PresentationTheme } from '@/types/slides';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Grid3x3, Presentation, Loader2, CheckCircle2 } from 'lucide-react';

// Import extracted modules
import { LiveSlidePreview } from '../../LiveSlidePreview.refactored';
import SlideCanvas from '../../SlideCanvas.refactored';

interface SlidesContentPanelProps {
  slides: Slide[];
  format: PresentationFormat;
  theme: PresentationTheme;
  isGenerating?: boolean;
}

type ViewMode = 'preview' | 'grid';

export function SlidesContentPanel({
  slides,
  format,
  theme,
  isGenerating = false,
}: SlidesContentPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [isExporting, setIsExporting] = useState(false);

  // ============================================
  // Export Handlers
  // ============================================
  const handleExport = async (exportFormat: 'pdf' | 'pptx') => {
    setIsExporting(true);
    try {
      // TODO: Call export API
      console.log(`Exporting to ${exportFormat}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert(`${exportFormat.toUpperCase()} Export würde hier starten`);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // ============================================
  // Empty State
  // ============================================
  if (slides.length === 0 && !isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <FileText className="w-16 h-16 text-muted-foreground/40 mb-4" />
        <h3 className="text-sm font-medium text-foreground/80 mb-2">
          Noch keine Slides
        </h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Erstelle eine Präsentation mit dem Prompt-Input.
        </p>
      </div>
    );
  }

  // ============================================
  // Main Render
  // ============================================
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            {slides.length} {slides.length === 1 ? 'Slide' : 'Slides'}
          </Badge>
          {isGenerating && (
            <Badge variant="default" className="animate-pulse">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Generating...
            </Badge>
          )}
          {!isGenerating && slides.length > 0 && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {format} • {theme}
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === 'preview' ? 'default' : 'ghost'}
            onClick={() => setViewMode('preview')}
            disabled={slides.length === 0}
          >
            <Presentation className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            onClick={() => setViewMode('grid')}
            disabled={slides.length === 0}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? (
          <LiveSlidePreview
            slides={slides}
            format={format}
            theme={theme}
            isGenerating={isGenerating}
            onExport={handleExport}
          />
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-6">
              {slides.map((slide, index) => (
                <div key={slide.id || index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Slide {slide.order_index || index + 1}</Badge>
                    <span className="text-sm text-muted-foreground truncate">{slide.title}</span>
                  </div>
                  <SlideCanvas slide={slide} format={format} theme={theme} className="w-full" />
                  {slide.speaker_notes && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                      <strong>📝 Notes:</strong> {slide.speaker_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {slides.length > 0 && (
        <div className="px-4 py-3 border-t bg-card/50 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Ready to export</div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('pdf')}
              disabled={isExporting || isGenerating}
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              PDF
            </Button>
            <Button
              size="sm"
              onClick={() => handleExport('pptx')}
              disabled={isExporting || isGenerating}
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              PPTX
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

