/**
 * Thinking Display
 *
 * Shows the AI's step-by-step reasoning process.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

'use client';

import React from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { ThinkingStep } from './ThinkingStep';
import { ThinkingStepSkeleton } from './ThinkingStepSkeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Brain } from 'lucide-react';

export function ThinkingDisplay() {
  const thinkingSteps = useSlidesStore((state) => state.thinkingSteps);
  const generationStatus = useSlidesStore((state) => state.generationStatus);

  if (generationStatus === 'idle' || generationStatus === 'completed') {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-primary" />
          AI Thinking Process
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {thinkingSteps.length === 0 ? (
          <>
            <ThinkingStepSkeleton />
            <ThinkingStepSkeleton />
          </>
        ) : (
          thinkingSteps.map((step) => <ThinkingStep key={step.id} step={step} />)
        )}
      </CardContent>
    </Card>
  );
}
