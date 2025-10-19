'use client';

import React from 'react';
import { SlidesMessage } from '@/types/slides';
import { Loader2 } from 'lucide-react';

interface ThinkingMessageProps {
  message: SlidesMessage;
}

export function ThinkingMessage({ message }: ThinkingMessageProps) {
  const content = typeof message.content === 'string' ? message.content : 'Denkt nach...';

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
        <div className="flex items-center gap-2 text-pw-black/60">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{content}</span>
        </div>
      </div>
    </div>
  );
}
