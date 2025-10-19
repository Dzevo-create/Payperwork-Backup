'use client';

import React, { useEffect, useRef } from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { UserMessage } from './messages/UserMessage';
import { ThinkingMessage } from './messages/ThinkingMessage';
import { TopicsMessage } from './messages/TopicsMessage';
import { GenerationMessage } from './messages/GenerationMessage';
import { ResultMessage } from './messages/ResultMessage';
import { ToolActionMessage } from './messages/ToolActionMessage';
import { ToolAction } from '@/types/slides';
import { Presentation } from 'lucide-react';

export function SlidesMessageList() {
  const messages = useSlidesStore((state) => state.messages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Presentation className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Create Your Presentation</h2>
          <p className="text-muted-foreground">
            Describe what you want your presentation to be about, and I'll generate it for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-6 max-w-4xl mx-auto">
        {messages.map((message) => {
          switch (message.type) {
            case 'user':
              return <UserMessage key={message.id} message={message} />;
            case 'thinking':
              return <ThinkingMessage key={message.id} message={message} />;
            case 'topics':
              return <TopicsMessage key={message.id} message={message} />;
            case 'generation':
              return <GenerationMessage key={message.id} message={message} />;
            case 'result':
              return <ResultMessage key={message.id} message={message} />;
            case 'tool_action':
              return <ToolActionMessage key={message.id} toolAction={message.content as ToolAction} />;
            default:
              return null;
          }
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
