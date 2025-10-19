'use client';

import React from 'react';
import { SlidesMessage } from '@/types/slides';

interface UserMessageProps {
  message: SlidesMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  const content = typeof message.content === 'string' ? message.content : '';

  const timeString = new Date(message.timestamp || Date.now()).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="group flex flex-col items-end pr-12 sm:pr-16 md:pr-24 lg:pr-32">
      {/* Timestamp */}
      <div className="text-[10px] text-pw-black/40 mb-1 px-1 text-right">
        {timeString}
      </div>

      {/* Message Bubble */}
      <div className="inline-block max-w-[85%] md:max-w-[80%] px-3 sm:px-4 py-2.5 sm:py-3 bg-white/90 border border-pw-black/10 text-pw-black shadow-sm rounded-2xl">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
