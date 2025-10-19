/**
 * Enhanced Thinking Message - Phase 3: Manus Mirroring
 *
 * Advanced thinking display with:
 * - Multi-line formatting with markdown-like syntax
 * - Progress indicators (percentage, time elapsed)
 * - Structured reasoning steps (collapsible)
 * - Tool usage indicators
 * - Real-time updates
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Thinking Display Enhancement
 */

'use client';

import React, { useState, useEffect } from 'react';
import { SlidesMessage } from '@/types/slides';
import {
  Loader2,
  Search,
  Globe,
  Code,
  Terminal,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Brain,
} from 'lucide-react';

interface EnhancedThinkingMessageProps {
  message: SlidesMessage;
  progress?: number; // 0-100
  steps?: ThinkingStep[];
}

interface ThinkingStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  description?: string;
  startedAt?: string;
  completedAt?: string;
}

export function EnhancedThinkingMessage({
  message,
  progress = 0,
  steps = [],
}: EnhancedThinkingMessageProps) {
  const [expanded, setExpanded] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTime = new Date(message.timestamp || Date.now()).getTime();

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const content =
    typeof message.content === 'string' ? message.content : 'Denkt nach...';

  const timeString = new Date(message.timestamp || Date.now()).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Parse content for tool usage indicators
  const toolsUsed = {
    search: content.toLowerCase().includes('search') || content.toLowerCase().includes('suche'),
    browse: content.toLowerCase().includes('browse') || content.toLowerCase().includes('browser'),
    python: content.toLowerCase().includes('python') || content.toLowerCase().includes('code'),
    bash: content.toLowerCase().includes('bash') || content.toLowerCase().includes('terminal'),
    file: content.toLowerCase().includes('file') || content.toLowerCase().includes('datei'),
  };

  // Format multi-line content with better parsing
  const formattedContent = parseThinkingContent(content);

  // Calculate overall status
  const completedSteps = steps.filter((s) => s.status === 'completed').length;
  const totalSteps = steps.length;
  const hasSteps = totalSteps > 0;
  const calculatedProgress = hasSteps ? (completedSteps / totalSteps) * 100 : progress;

  // Format elapsed time
  const formatElapsed = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="group flex flex-col items-start pl-12 sm:pl-16 md:pl-24 lg:pl-32">
      {/* Timestamp */}
      <div className="text-[10px] text-pw-black/40 mb-1 px-1 text-left">{timeString}</div>

      {/* Message Bubble */}
      <div className="max-w-3xl w-full bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div
          className="px-4 py-3 bg-gradient-to-r from-purple-100/50 to-blue-100/50 border-b border-purple-200 cursor-pointer hover:bg-purple-100/70 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Spinner or Brain Icon */}
              <div className="relative">
                <Brain className="w-5 h-5 text-purple-600" />
                <Loader2 className="w-5 h-5 animate-spin text-purple-600 absolute inset-0" />
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-semibold text-purple-900">
                  Payperwork AI denkt nach...
                </span>
                <div className="flex items-center gap-2 text-xs text-purple-600">
                  <Clock className="w-3 h-3" />
                  <span>{formatElapsed(elapsedTime)}</span>
                  {hasSteps && (
                    <>
                      <span>•</span>
                      <span>
                        {completedSteps}/{totalSteps} Schritte
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Progress Indicator */}
              {calculatedProgress > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${calculatedProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-purple-700">
                    {Math.round(calculatedProgress)}%
                  </span>
                </div>
              )}

              {/* Expand/Collapse */}
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-purple-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-600" />
              )}
            </div>
          </div>
        </div>

        {/* Content (Collapsible) */}
        {expanded && (
          <div className="px-4 py-3 space-y-3">
            {/* Tool Usage Indicators */}
            {Object.values(toolsUsed).some((used) => used) && (
              <div className="flex gap-2 flex-wrap">
                {toolsUsed.search && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                    <Search className="w-3 h-3" />
                    Google Suche
                  </span>
                )}
                {toolsUsed.browse && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                    <Globe className="w-3 h-3" />
                    Web-Browsing
                  </span>
                )}
                {toolsUsed.python && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs font-medium">
                    <Code className="w-3 h-3" />
                    Python Code
                  </span>
                )}
                {toolsUsed.bash && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                    <Terminal className="w-3 h-3" />
                    Bash
                  </span>
                )}
                {toolsUsed.file && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                    <FileText className="w-3 h-3" />
                    Datei
                  </span>
                )}
              </div>
            )}

            {/* Reasoning Steps */}
            {hasSteps && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-purple-900 flex items-center gap-2">
                  <Brain className="w-3 h-3" />
                  Denkschritte
                </h4>
                <div className="space-y-1">
                  {steps.map((step, index) => (
                    <ReasoningStep key={step.id} step={step} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="text-sm text-pw-black/80 space-y-2">
              {formattedContent.map((block, index) => (
                <ContentBlock key={index} block={block} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Sub-Components =====

interface ReasoningStepProps {
  step: ThinkingStep;
  index: number;
}

function ReasoningStep({ step, index }: ReasoningStepProps) {
  const statusIcon = {
    pending: <div className="w-4 h-4 rounded-full border-2 border-gray-300" />,
    running: <Loader2 className="w-4 h-4 animate-spin text-blue-600" />,
    completed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    failed: <div className="w-4 h-4 rounded-full bg-red-500" />,
  }[step.status];

  const statusColor = {
    pending: 'bg-gray-50 border-gray-200',
    running: 'bg-blue-50 border-blue-200',
    completed: 'bg-green-50 border-green-200',
    failed: 'bg-red-50 border-red-200',
  }[step.status];

  return (
    <div className={`flex items-start gap-2 p-2 rounded-md border ${statusColor} transition-all`}>
      <div className="flex-shrink-0 mt-0.5">{statusIcon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-pw-black/70">
            {index + 1}. {step.title}
          </span>
          {step.status === 'running' && (
            <span className="text-[10px] text-blue-600 animate-pulse">läuft...</span>
          )}
        </div>
        {step.description && (
          <p className="text-xs text-pw-black/60 mt-0.5">{step.description}</p>
        )}
      </div>
    </div>
  );
}

interface ContentBlock {
  type: 'text' | 'heading' | 'list' | 'code';
  content: string;
  items?: string[];
}

interface ContentBlockProps {
  block: ContentBlock;
}

function ContentBlock({ block }: ContentBlockProps) {
  switch (block.type) {
    case 'heading':
      return <h4 className="text-sm font-semibold text-purple-900">{block.content}</h4>;
    case 'list':
      return (
        <ul className="space-y-1 pl-4">
          {block.items?.map((item, i) => (
            <li key={i} className="text-sm text-pw-black/70 flex items-start gap-2">
              <span className="text-purple-500 mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'code':
      return (
        <pre className="text-xs bg-gray-900 text-gray-100 p-2 rounded font-mono overflow-x-auto">
          {block.content}
        </pre>
      );
    case 'text':
    default:
      return <p className="text-sm text-pw-black/70 leading-relaxed">{block.content}</p>;
  }
}

// ===== Content Parser =====

function parseThinkingContent(content: string): ContentBlock[] {
  const lines = content.split('\n').filter((line) => line.trim());
  const blocks: ContentBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Heading (starts with # or **)
    if (line.startsWith('#') || (line.startsWith('**') && line.endsWith('**'))) {
      blocks.push({
        type: 'heading',
        content: line.replace(/^#+\s*/, '').replace(/\*\*/g, ''),
      });
      i++;
    }
    // List (starts with - or *)
    else if (line.startsWith('-') || line.startsWith('*')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('-') || lines[i].trim().startsWith('*'))) {
        items.push(lines[i].trim().replace(/^[-*]\s*/, ''));
        i++;
      }
      blocks.push({ type: 'list', content: '', items });
    }
    // Code (starts with ``` or 4 spaces)
    else if (line.startsWith('```') || line.startsWith('    ')) {
      const codeLines: string[] = [];
      if (line.startsWith('```')) {
        i++; // Skip opening ```
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // Skip closing ```
      } else {
        while (i < lines.length && lines[i].startsWith('    ')) {
          codeLines.push(lines[i].substring(4));
          i++;
        }
      }
      blocks.push({ type: 'code', content: codeLines.join('\n') });
    }
    // Text
    else {
      blocks.push({ type: 'text', content: line });
      i++;
    }
  }

  return blocks;
}
