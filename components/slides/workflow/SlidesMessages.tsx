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
  const showComputerPanel = useSlidesStore((state) => state.showComputerPanel);

  return (
    <div className="px-3 sm:px-4 md:px-6 py-6">
      <div className={`${showComputerPanel ? 'w-full' : 'max-w-5xl mx-auto'} space-y-4 sm:space-y-6`}>
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
    </div>
  );
}
