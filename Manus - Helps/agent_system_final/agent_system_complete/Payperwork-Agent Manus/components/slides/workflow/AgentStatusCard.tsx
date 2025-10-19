/**
 * Agent Status Card Component
 *
 * Displays real-time status of active agents in the pipeline.
 * Shows current action, progress, and visual indicators.
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
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// ============================================
// Types
// ============================================

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'waiting' | 'completed' | 'error';
export type AgentAction = 'researching' | 'analyzing' | 'planning' | 'generating' | 'reviewing' | 'optimizing' | 'validating';

export interface AgentStatusCardProps {
  agent: string;
  status: AgentStatus;
  currentAction?: AgentAction;
  progress?: number;
  className?: string;
}

// ============================================
// Agent Configuration
// ============================================

const AGENT_CONFIG = {
  ResearchAgent: {
    icon: Search,
    color: 'blue',
    name: 'Research',
  },
  TopicAgent: {
    icon: FileText,
    color: 'green',
    name: 'Topics',
  },
  ContentAgent: {
    icon: PenTool,
    color: 'purple',
    name: 'Content',
  },
  DesignerAgent: {
    icon: Palette,
    color: 'pink',
    name: 'Design',
  },
  QualityAgent: {
    icon: CheckCircle,
    color: 'orange',
    name: 'Quality',
  },
  OrchestratorAgent: {
    icon: Brain,
    color: 'indigo',
    name: 'Orchestrator',
  },
} as const;

const STATUS_CONFIG = {
  idle: {
    icon: null,
    label: 'Idle',
    color: 'text-gray-400',
  },
  thinking: {
    icon: Brain,
    label: 'Thinking',
    color: 'text-blue-500',
  },
  working: {
    icon: Loader2,
    label: 'Working',
    color: 'text-green-500',
    animate: true,
  },
  waiting: {
    icon: Loader2,
    label: 'Waiting',
    color: 'text-yellow-500',
    animate: true,
  },
  completed: {
    icon: Check,
    label: 'Completed',
    color: 'text-green-600',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    color: 'text-red-500',
  },
} as const;

const ACTION_LABELS: Record<AgentAction, string> = {
  researching: 'Researching sources',
  analyzing: 'Analyzing data',
  planning: 'Planning structure',
  generating: 'Generating content',
  reviewing: 'Reviewing quality',
  optimizing: 'Optimizing output',
  validating: 'Validating results',
};

// ============================================
// Component
// ============================================

export function AgentStatusCard({
  agent,
  status,
  currentAction,
  progress,
  className,
}: AgentStatusCardProps) {
  const agentConfig = AGENT_CONFIG[agent as keyof typeof AGENT_CONFIG] || AGENT_CONFIG.OrchestratorAgent;
  const statusConfig = STATUS_CONFIG[status];
  
  const AgentIcon = agentConfig.icon;
  const StatusIcon = statusConfig.icon;

  const isActive = status === 'working' || status === 'thinking';
  const isCompleted = status === 'completed';
  const isError = status === 'error';

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg border transition-all duration-300',
        isActive && 'ring-2 ring-offset-2',
        isActive && `ring-${agentConfig.color}-500/50`,
        isCompleted && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
        isError && 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
        !isCompleted && !isError && 'bg-card border-border',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        {/* Agent Info */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              `bg-${agentConfig.color}-500/10`
            )}
          >
            <AgentIcon className={cn('w-4 h-4', `text-${agentConfig.color}-500`)} />
          </div>
          <div>
            <div className="text-sm font-medium">{agentConfig.name}</div>
            {currentAction && (
              <div className="text-xs text-muted-foreground">
                {ACTION_LABELS[currentAction]}
              </div>
            )}
          </div>
        </div>

        {/* Status Icon */}
        {StatusIcon && (
          <StatusIcon
            className={cn(
              'w-5 h-5',
              statusConfig.color,
              statusConfig.animate && 'animate-spin'
            )}
          />
        )}
      </div>

      {/* Progress Bar */}
      {typeof progress === 'number' && progress > 0 && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5" />
          <div className="text-xs text-muted-foreground text-right">
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {/* Status Label */}
      <div className={cn('text-xs font-medium mt-2', statusConfig.color)}>
        {statusConfig.label}
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute top-2 right-2">
          <span className="relative flex h-2 w-2">
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                `bg-${agentConfig.color}-500`
              )}
            />
            <span
              className={cn(
                'relative inline-flex rounded-full h-2 w-2',
                `bg-${agentConfig.color}-500`
              )}
            />
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================
// Compact Variant
// ============================================

export function AgentStatusCardCompact({
  agent,
  status,
  className,
}: Omit<AgentStatusCardProps, 'currentAction' | 'progress'>) {
  const agentConfig = AGENT_CONFIG[agent as keyof typeof AGENT_CONFIG] || AGENT_CONFIG.OrchestratorAgent;
  const statusConfig = STATUS_CONFIG[status];
  
  const AgentIcon = agentConfig.icon;
  const StatusIcon = statusConfig.icon;

  const isActive = status === 'working' || status === 'thinking';

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md border',
        isActive && `bg-${agentConfig.color}-500/5`,
        className
      )}
    >
      <AgentIcon className={cn('w-4 h-4', `text-${agentConfig.color}-500`)} />
      <span className="text-sm flex-1">{agentConfig.name}</span>
      {StatusIcon && (
        <StatusIcon
          className={cn(
            'w-4 h-4',
            statusConfig.color,
            statusConfig.animate && 'animate-spin'
          )}
        />
      )}
    </div>
  );
}

