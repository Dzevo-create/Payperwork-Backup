/**
 * Slides Preview Panel
 *
 * Live preview of slides being generated.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

'use client';

import React from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { LiveSlidePreview } from './LiveSlidePreview';
import { ProgressIndicator } from './ProgressIndicator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Monitor } from 'lucide-react';

export function SlidesPreviewPanel() {
  const livePreviewSlide = useSlidesStore((state) => state.livePreviewSlide);
  const generationStatus = useSlidesStore((state) => state.generationStatus);

  if (generationStatus === 'idle') {
    return null;
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Monitor className="h-5 w-5 text-primary" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ProgressIndicator />

        {livePreviewSlide ? (
          <LiveSlidePreview slide={livePreviewSlide} />
        ) : (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">Waiting for slides...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
