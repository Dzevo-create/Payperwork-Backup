/**
 * Slides Messages Component
 *
 * Wrapper for displaying slides workflow messages.
 * Renders different message types (user, thinking, topics, generation, result).
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

'use client';

import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { UserMessage } from './messages/UserMessage';
import { ThinkingMessage } from './messages/ThinkingMessage';
import { TopicsMessage } from './messages/TopicsMessage';
import { GenerationMessage } from './messages/GenerationMessage';
import { ResultMessage } from './messages/ResultMessage';

export function SlidesMessages() {
  const messages = useSlidesStore((state) => state.messages);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
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

          default:
            return null;
        }
      })}
    </div>
  );
}
