'use client';

import React from 'react';
import { SlidesMessage } from '@/types/slides';
import { Loader2, Search, Globe, Code } from 'lucide-react';

interface ThinkingMessageProps {
  message: SlidesMessage;
}

export function ThinkingMessage({ message }: ThinkingMessageProps) {
  const content = typeof message.content === 'string' ? message.content : 'Denkt nach...';

  const timeString = new Date(message.timestamp || Date.now()).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Parse content for tool usage indicators
  const hasSearch = content.toLowerCase().includes('search') || content.toLowerCase().includes('suche');
  const hasBrowse = content.toLowerCase().includes('browse') || content.toLowerCase().includes('browser');
  const hasPython = content.toLowerCase().includes('python') || content.toLowerCase().includes('code');

  // Format multi-line content with line breaks
  const formattedContent = content.split('\n').filter(line => line.trim());

  return (
    <div className="group flex flex-col items-start pl-12 sm:pl-16 md:pl-24 lg:pl-32">
      {/* Timestamp */}
      <div className="text-[10px] text-pw-black/40 mb-1 px-1 text-left">
        {timeString}
      </div>

      {/* Message Bubble */}
      <div className="max-w-3xl w-full bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-lg px-4 py-3 shadow-sm">
        {/* Header with spinner */}
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
          <span className="text-xs font-medium text-purple-700">Payperwork AI denkt nach...</span>
        </div>

        {/* Tool Usage Indicators */}
        {(hasSearch || hasBrowse || hasPython) && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {hasSearch && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                <Search className="w-3 h-3" />
                Suche
              </span>
            )}
            {hasBrowse && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                <Globe className="w-3 h-3" />
                Browse
              </span>
            )}
            {hasPython && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                <Code className="w-3 h-3" />
                Python
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="text-sm text-pw-black/80 space-y-1">
          {formattedContent.map((line, index) => (
            <p key={index} className="leading-relaxed">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
