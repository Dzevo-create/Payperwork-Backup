/**
 * Thinking Step
 *
 * Single thinking step with collapsible actions.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Frontend Components
 */

'use client';

import React, { useState } from 'react';
import { ThinkingStep as ThinkingStepType } from '@/types/slides';
import { ThinkingAction } from './ThinkingAction';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface ThinkingStepProps {
  step: ThinkingStepType;
}

export function ThinkingStep({ step }: ThinkingStepProps) {
  const [isExpanded, setIsExpanded] = useState(step.status === 'running');

  // Auto-expand when status changes to running
  React.useEffect(() => {
    if (step.status === 'running') {
      setIsExpanded(true);
    }
  }, [step.status]);

  // Status icon
  const StatusIcon = {
    pending: Circle,
    running: Loader2,
    completed: CheckCircle2,
    failed: XCircle,
  }[step.status];

  // Status color
  const statusColor = {
    pending: 'text-muted-foreground',
    running: 'text-blue-500',
    completed: 'text-green-500',
    failed: 'text-red-500',
  }[step.status];

  return (
    <div className="border rounded-lg p-4 space-y-2">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-3 text-left hover:opacity-80 transition-opacity"
      >
        {/* Status Icon */}
        <StatusIcon
          className={cn(
            'h-5 w-5 flex-shrink-0 mt-0.5',
            statusColor,
            step.status === 'running' && 'animate-spin'
          )}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{step.title}</h4>
            {step.status === 'running' && (
              <span className="text-xs text-muted-foreground animate-pulse">
                In progress...
              </span>
            )}
          </div>
          {step.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {step.description}
            </p>
          )}
        </div>

        {/* Expand/Collapse Icon */}
        {step.actions.length > 0 && (
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
      </button>

      {/* Actions (Collapsible) */}
      {isExpanded && step.actions.length > 0 && (
        <div className="ml-8 space-y-1.5 pt-2 border-t">
          {step.actions.map((action) => (
            <ThinkingAction key={action.id} action={action} />
          ))}
        </div>
      )}

      {/* Result (if completed) */}
      {step.status === 'completed' && step.result && (
        <div className="ml-8 mt-2 p-3 bg-muted/50 rounded-md">
          <p className="text-sm text-muted-foreground">{step.result}</p>
        </div>
      )}
    </div>
  );
}
