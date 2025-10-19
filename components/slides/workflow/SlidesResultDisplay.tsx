/**
 * Slides Result Display
 *
 * Shows final presentation after completion.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

'use client';

import React from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Download, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SlidesResultDisplay() {
  const finalPresentation = useSlidesStore((state) => state.finalPresentation);
  const finalSlides = useSlidesStore((state) => state.finalSlides);
  const router = useRouter();

  if (!finalPresentation) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          Presentation Ready!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{finalPresentation.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {finalSlides.length} slides • {finalPresentation.format} •{' '}
            {finalPresentation.theme} theme
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/slides/${finalPresentation.id}`)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            View & Edit
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
