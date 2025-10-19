'use client';

import React from 'react';
import { SlidesMessage } from '@/types/slides';

interface ThinkingMessageProps {
  message: SlidesMessage;
}

export function ThinkingMessage({ message }: ThinkingMessageProps) {
  const content = typeof message.content === 'string' ? message.content : 'Okay, ich recherchiere und erstelle dir einen Vorschlag für den Content.';

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

      {/* Simple text message - no background, no spinner */}
      <div className="max-w-3xl w-full">
        <p className="text-sm text-pw-black/70 leading-relaxed">
          {content}
        </p>
      </div>
    </div>
  );
}
