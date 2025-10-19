'use client';

import React from 'react';
import { SlidesMessage } from '@/types/slides';
import { User } from 'lucide-react';

interface UserMessageProps {
  message: SlidesMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  const content = typeof message.content === 'string' ? message.content : '';

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <User className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1">
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
