/**
 * Agent Thinking Message Component
 *
 * Displays thinking steps from different agents with icons and colors.
 * Inspired by Manus AI's generative UI.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

'use client';

import React from 'react';
import {
  Brain,
  Search,
  FileText,
  PenTool,
  Palette,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

export interface AgentThinkingMessageProps {
  agent: string;
  content: string;
  timestamp?: string;
  className?: string;
}

// ============================================
// Agent Configuration
// ============================================

const AGENT_CONFIG = {
  ResearchAgent: {
    icon: Search,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    name: 'Research Agent',
  },
  TopicAgent: {
    icon: FileText,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    name: 'Topic Agent',
  },
  ContentAgent: {
    icon: PenTool,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
    name: 'Content Agent',
  },
  DesignerAgent: {
    icon: Palette,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    name: 'Designer Agent',
  },
  QualityAgent: {
    icon: CheckCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
    name: 'Quality Agent',
  },
  OrchestratorAgent: {
    icon: Brain,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
    name: 'Orchestrator',
  },
} as const;

type AgentType = keyof typeof AGENT_CONFIG;

// ============================================
// Component
// ============================================

export function AgentThinkingMessage({
  agent,
  content,
  timestamp,
  className,
}: AgentThinkingMessageProps) {
  const config = AGENT_CONFIG[agent as AgentType] || AGENT_CONFIG.OrchestratorAgent;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border transition-all duration-300',
        'animate-in fade-in slide-in-from-bottom-2',
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      {/* Agent Icon */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            'animate-pulse',
            config.bgColor
          )}
        >
          <Icon className={cn('w-4 h-4', config.color)} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Agent Name */}
        <div className="flex items-center gap-2 mb-1">
          <span className={cn('text-sm font-medium', config.color)}>
            {config.name}
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {new Date(timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        {/* Thinking Content */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          {content}
        </p>
      </div>

      {/* Animated Dots */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full animate-bounce',
            config.color.replace('text-', 'bg-')
          )}
          style={{ animationDelay: '0ms' }}
        />
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full animate-bounce',
            config.color.replace('text-', 'bg-')
          )}
          style={{ animationDelay: '150ms' }}
        />
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full animate-bounce',
            config.color.replace('text-', 'bg-')
          )}
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}

// ============================================
// Compact Variant
// ============================================

export function AgentThinkingMessageCompact({
  agent,
  content,
  className,
}: AgentThinkingMessageProps) {
  const config = AGENT_CONFIG[agent as AgentType] || AGENT_CONFIG.OrchestratorAgent;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md',
        'animate-in fade-in slide-in-from-left-2',
        config.bgColor,
        className
      )}
    >
      <Icon className={cn('w-3.5 h-3.5 animate-pulse', config.color)} />
      <span className="text-xs text-foreground/70">{content}</span>
    </div>
  );
}

