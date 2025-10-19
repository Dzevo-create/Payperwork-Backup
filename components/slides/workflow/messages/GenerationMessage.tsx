'use client';

import React from 'react';
import { SlidesMessage, SlidesMessageContent } from '@/types/slides';
import { Bot, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface GenerationMessageProps {
  message: SlidesMessage;
}

export function GenerationMessage({ message }: GenerationMessageProps) {
  const content = message.content as SlidesMessageContent;
  const text = typeof message.content === 'string' ? message.content : 'Creating slides...';
  const progress = content?.progress || 0;

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">{text}</p>
          </div>

          {progress > 0 && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">{progress}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
