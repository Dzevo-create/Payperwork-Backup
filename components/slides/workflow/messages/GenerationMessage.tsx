'use client';

import React from 'react';
import { SlidesMessage, SlidesMessageContent } from '@/types/slides';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface GenerationMessageProps {
  message: SlidesMessage;
}

export function GenerationMessage({ message }: GenerationMessageProps) {
  const content = message.content as SlidesMessageContent;
  const text = typeof message.content === 'string' ? message.content : 'Erstelle Folien...';
  const progress = content?.progress || 0;

  const timeString = new Date(message.timestamp || Date.now()).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group flex flex-col items-start pl-12 sm:pl-16 md:pl-24 lg:pl-32">
      {/* Timestamp */}
      <div className="text-[10px] text-pw-black/40 mb-1 px-1 text-left">
        {timeString}
      </div>

      {/* Message Bubble */}
      <div className="max-w-3xl w-full bg-transparent text-pw-black">
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="w-4 h-4 animate-spin text-pw-black/60" />
          <span className="text-sm font-medium">{text}</span>
        </div>

        {progress > 0 && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-pw-black/60 text-right">{progress}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
