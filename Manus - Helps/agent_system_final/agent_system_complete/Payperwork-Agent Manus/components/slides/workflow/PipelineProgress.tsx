/**
 * Pipeline Progress Component
 *
 * Displays overall pipeline progress with phase indicators.
 * Shows which phase is currently active and completed phases.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

'use client';

import React from 'react';
import {
  Search,
  FileText,
  PenTool,
  CheckCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

// ============================================
// Types
// ============================================

export type PipelinePhase = 'research' | 'topic_generation' | 'content_generation' | 'pre_production';
export type PhaseStatus = 'pending' | 'active' | 'completed' | 'error';

export interface PipelineProgressProps {
  currentPhase?: PipelinePhase;
  completedPhases: PipelinePhase[];
  overallProgress?: number;
  className?: string;
}

// ============================================
// Phase Configuration
// ============================================

const PHASE_CONFIG: Record<
  PipelinePhase,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
  }
> = {
  research: {
    icon: Search,
    label: 'Research',
    color: 'blue',
  },
  topic_generation: {
    icon: FileText,
    label: 'Topics',
    color: 'green',
  },
  content_generation: {
    icon: PenTool,
    label: 'Content',
    color: 'purple',
  },
  pre_production: {
    icon: CheckCircle,
    label: 'Quality',
    color: 'orange',
  },
};

const PHASE_ORDER: PipelinePhase[] = [
  'research',
  'topic_generation',
  'content_generation',
  'pre_production',
];

// ============================================
// Component
// ============================================

export function PipelineProgress({
  currentPhase,
  completedPhases,
  overallProgress,
  className,
}: PipelineProgressProps) {
  const getPhaseStatus = (phase: PipelinePhase): PhaseStatus => {
    if (completedPhases.includes(phase)) return 'completed';
    if (currentPhase === phase) return 'active';
    return 'pending';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Progress */}
      {typeof overallProgress === 'number' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      )}

      {/* Phase Indicators */}
      <div className="grid grid-cols-4 gap-2">
        {PHASE_ORDER.map((phase, index) => {
          const config = PHASE_CONFIG[phase];
          const status = getPhaseStatus(phase);
          const Icon = config.icon;

          return (
            <PhaseIndicator
              key={phase}
              icon={Icon}
              label={config.label}
              color={config.color}
              status={status}
              index={index}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Phase Indicator
// ============================================

interface PhaseIndicatorProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  status: PhaseStatus;
  index: number;
}

function PhaseIndicator({
  icon: Icon,
  label,
  color,
  status,
  index,
}: PhaseIndicatorProps) {
  const isActive = status === 'active';
  const isCompleted = status === 'completed';
  const isPending = status === 'pending';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-300',
        isActive && 'ring-2 ring-offset-2',
        isActive && `ring-${color}-500/50 bg-${color}-500/5`,
        isCompleted && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
        isPending && 'bg-muted/30 border-border/50',
        !isPending && 'bg-card border-border'
      )}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-all',
          isActive && `bg-${color}-500/10`,
          isCompleted && 'bg-green-500/10',
          isPending && 'bg-muted'
        )}
      >
        {isCompleted ? (
          <Check className="w-5 h-5 text-green-600" />
        ) : isActive ? (
          <Loader2 className={cn('w-5 h-5 animate-spin', `text-${color}-500`)} />
        ) : (
          <Icon
            className={cn(
              'w-5 h-5',
              isPending ? 'text-muted-foreground' : `text-${color}-500`
            )}
          />
        )}
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-xs font-medium text-center',
          isActive && `text-${color}-600 dark:text-${color}-400`,
          isCompleted && 'text-green-600 dark:text-green-400',
          isPending && 'text-muted-foreground'
        )}
      >
        {label}
      </span>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                `bg-${color}-500`
              )}
            />
            <span
              className={cn(
                'relative inline-flex rounded-full h-3 w-3',
                `bg-${color}-500`
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

export function PipelineProgressCompact({
  currentPhase,
  completedPhases,
  className,
}: Omit<PipelineProgressProps, 'overallProgress'>) {
  const getPhaseStatus = (phase: PipelinePhase): PhaseStatus => {
    if (completedPhases.includes(phase)) return 'completed';
    if (currentPhase === phase) return 'active';
    return 'pending';
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {PHASE_ORDER.map((phase) => {
        const config = PHASE_CONFIG[phase];
        const status = getPhaseStatus(phase);
        const Icon = config.icon;

        const isActive = status === 'active';
        const isCompleted = status === 'completed';

        return (
          <div
            key={phase}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full transition-all',
              isActive && `bg-${config.color}-500/10`,
              isCompleted && 'bg-green-500/10',
              !isActive && !isCompleted && 'bg-muted'
            )}
          >
            {isCompleted ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : isActive ? (
              <Loader2 className={cn('w-4 h-4 animate-spin', `text-${config.color}-500`)} />
            ) : (
              <Icon className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
}

