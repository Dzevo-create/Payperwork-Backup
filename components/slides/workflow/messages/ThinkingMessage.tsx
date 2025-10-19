'use client';

import React, { useState, useEffect } from 'react';
import { SlidesMessage } from '@/types/slides';
import { Loader2 } from 'lucide-react';

interface ThinkingMessageProps {
  message: SlidesMessage;
}

export function ThinkingMessage({ message }: ThinkingMessageProps) {
  const fullContent = typeof message.content === 'string' ? message.content : 'Okay, ich recherchiere und erstelle dir einen Vorschlag für den Content.';

  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showLoader, setShowLoader] = useState(false);

  const timeString = new Date(message.timestamp || Date.now()).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Typing animation effect
  useEffect(() => {
    // Show loader for 300ms before typing
    setShowLoader(true);
    const loaderTimeout = setTimeout(() => {
      setShowLoader(false);

      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex <= fullContent.length) {
          setDisplayedContent(fullContent.substring(0, currentIndex));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typingInterval);
        }
      }, 30); // 30ms per character (faster typing)

      return () => clearInterval(typingInterval);
    }, 300);

    return () => clearTimeout(loaderTimeout);
  }, [fullContent]);

  return (
    <div className="group flex flex-col items-start pl-12 sm:pl-16 md:pl-24 lg:pl-32">
      {/* Timestamp */}
      <div className="text-[10px] text-pw-black/40 mb-1 px-1 text-left">
        {timeString}
      </div>

      {/* Message with typing animation */}
      <div className="max-w-3xl w-full">
        {showLoader ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-pw-black/40" />
            <span className="text-sm text-pw-black/40">Denkt nach...</span>
          </div>
        ) : (
          <p className="text-sm text-pw-black/70 leading-relaxed">
            {displayedContent}
            {isTyping && <span className="animate-pulse">|</span>}
          </p>
        )}
      </div>
    </div>
  );
}
