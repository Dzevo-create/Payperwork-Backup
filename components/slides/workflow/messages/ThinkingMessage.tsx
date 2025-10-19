'use client';

import React from 'react';
import { SlidesMessage } from '@/types/slides';
import { Bot, Loader2 } from 'lucide-react';

interface ThinkingMessageProps {
  message: SlidesMessage;
}

export function ThinkingMessage({ message }: ThinkingMessageProps) {
  const content = typeof message.content === 'string' ? message.content : 'Thinking...';

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
        <Bot className="w-4 h-4 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
