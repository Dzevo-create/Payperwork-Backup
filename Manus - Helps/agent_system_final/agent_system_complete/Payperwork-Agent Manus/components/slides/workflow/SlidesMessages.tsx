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
import { AgentThinkingMessage } from './messages/AgentThinkingMessage';
import { ResearchSourceCard } from './messages/ResearchSourceCard';

export function SlidesMessages() {
  const messages = useSlidesStore((state) => state.messages);

  return (
    <div className="px-3 sm:px-4 md:px-6 py-6">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
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

            case 'agent_thinking':
              return (
                <AgentThinkingMessage
                  key={message.id}
                  agent={(message.content as any).agent}
                  content={(message.content as any).message}
                  timestamp={message.timestamp}
                />
              );

            case 'research_source':
              return (
                <ResearchSourceCard
                  key={message.id}
                  title={(message.content as any).title}
                  url={(message.content as any).url}
                  snippet={(message.content as any).snippet}
                  relevance={(message.content as any).relevance}
                  timestamp={message.timestamp}
                />
              );

            case 'agent_insight':
              return (
                <div key={message.id} className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                        {(message.content as any).agent} Insight
                      </div>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {(message.content as any).insight}
                      </p>
                      <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                        Confidence: {(message.content as any).confidence}%
                      </div>
                    </div>
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
