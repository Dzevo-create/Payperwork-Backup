/**
 * Improved Slides Content Panel
 * 
 * Shows slides in Payperwork Panel with:
 * - Live preview during generation
 * - Correct aspect ratios
 * - Professional layouts
 * - Export functions
 * 
 * @author Payperwork Team
 * @date 2025-10-20
 */

'use client';

import React, { useState } from 'react';
import { Slide, PresentationFormat, PresentationTheme } from '@/types/slides';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Download, 
  Grid3x3, 
  Presentation,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { LiveSlidePreview } from '../../LiveSlidePreview.improved';
import SlideCanvas from '../../SlideCanvas.improved';

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
  // Export Functions
  // ============================================
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      // TODO: Implement PDF export
      console.log('Exporting to PDF...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate export
      alert('PDF Export würde hier starten (TODO: Implementieren)');
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPPTX = async () => {
    setIsExporting(true);
    try {
      // TODO: Implement PPTX export
      console.log('Exporting to PPTX...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate export
      alert('PPTX Export würde hier starten (TODO: Implementieren)');
    } catch (error) {
      console.error('PPTX export failed:', error);
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
      {/* Header with Actions */}
      <div className="px-4 py-3 border-b bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Slide Count */}
          <div className="flex items-center gap-2">
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
          </div>

          {/* Format & Theme */}
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

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? (
          // ============================================
          // PREVIEW MODE: Live Slide Preview
          // ============================================
          <LiveSlidePreview
            slides={slides}
            format={format}
            theme={theme}
            isGenerating={isGenerating}
          />
        ) : (
          // ============================================
          // GRID MODE: All Slides Scrollable
          // ============================================
          <div className="h-full overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-6">
              {slides.map((slide, index) => (
                <div key={slide.id || index} className="space-y-2">
                  {/* Slide Number & Title */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Slide {slide.order_index || index + 1}
                    </Badge>
                    <span className="text-sm text-muted-foreground truncate">
                      {slide.title}
                    </span>
                  </div>

                  {/* Slide Canvas */}
                  <SlideCanvas
                    slide={slide}
                    format={format}
                    theme={theme}
                    className="w-full"
                  />

                  {/* Speaker Notes (if any) */}
                  {slide.speaker_notes && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                      <strong>📝 Speaker Notes:</strong> {slide.speaker_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer with Export Actions */}
      {slides.length > 0 && (
        <div className="px-4 py-3 border-t bg-card/50 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Ready to export
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportPDF}
              disabled={isExporting || isGenerating}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export PDF
            </Button>
            <Button
              size="sm"
              onClick={handleExportPPTX}
              disabled={isExporting || isGenerating}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export PPTX
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

