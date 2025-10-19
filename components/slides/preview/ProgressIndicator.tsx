/**
 * Progress Indicator
 *
 * Shows generation progress.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

'use client';

import React from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';

export function ProgressIndicator() {
  const [progress, setProgress] = React.useState(0);
  const [currentStep, setCurrentStep] = React.useState('Initializing...');
  const generationStatus = useSlidesStore((state) => state.generationStatus);

  React.useEffect(() => {
    if (generationStatus === 'thinking') {
      setProgress(20);
      setCurrentStep('AI is analyzing your request...');
    } else if (generationStatus === 'generating') {
      setProgress(60);
      setCurrentStep('Generating slides...');
    } else if (generationStatus === 'completed') {
      setProgress(100);
      setCurrentStep('Completed!');
    }
  }, [generationStatus]);

  return (
    <div className="space-y-2">
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{currentStep}</span>
        <span className="font-medium">{progress}%</span>
      </div>
    </div>
  );
}
