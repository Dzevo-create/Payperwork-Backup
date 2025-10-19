/**
 * Agent Status Indicator
 *
 * Displays the current agent status during slides generation.
 * Shows agent name, status, current action, and progress.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 2: Frontend Integration
 */

'use client';

import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { AgentType } from '@/types/slides';

const AGENT_ICONS: Record<AgentType, string> = {
  ResearchAgent: '🔍',
  TopicAgent: '📋',
  ContentAgent: '✍️',
  DesignerAgent: '🎨',
  QualityAgent: '✅',
  OrchestratorAgent: '🎯',
};

const AGENT_NAMES: Record<AgentType, string> = {
  ResearchAgent: 'Research Agent',
  TopicAgent: 'Topic Agent',
  ContentAgent: 'Content Agent',
  DesignerAgent: 'Designer Agent',
  QualityAgent: 'Quality Agent',
  OrchestratorAgent: 'Orchestrator',
};

export function AgentStatusIndicator() {
  const currentAgent = useSlidesStore((state) => state.currentAgent);
  const agentStatus = useSlidesStore((state) => state.agentStatus);
  const pipelineProgress = useSlidesStore((state) => state.pipelineProgress);

  // Don't show if no agent is working
  if (!currentAgent) return null;

  const status = agentStatus[currentAgent];
  if (!status) return null;

  return (
    <div className="mb-4 rounded-xl border border-pw-black/10 bg-white/80 backdrop-blur-sm p-4 shadow-sm">
      {/* Agent Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl">{AGENT_ICONS[currentAgent]}</div>
        <div className="flex-1">
          <div className="font-medium text-sm text-pw-black">
            {AGENT_NAMES[currentAgent]}
          </div>
          {status.currentAction && (
            <div className="text-xs text-pw-black/60 mt-0.5">
              {status.currentAction}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status.status === 'working' && (
            <div className="w-2 h-2 rounded-full bg-pw-accent animate-pulse" />
          )}
          <span className="text-xs text-pw-black/60 capitalize">
            {status.status}
          </span>
        </div>
      </div>

      {/* Progress Bar (if available) */}
      {status.progress !== undefined && status.progress > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-pw-black/60 mb-1">
            <span>Progress</span>
            <span>{status.progress}%</span>
          </div>
          <div className="h-1.5 bg-pw-black/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-pw-accent transition-all duration-300"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Pipeline Progress (overall) */}
      {pipelineProgress.overallProgress > 0 && (
        <div className="pt-3 border-t border-pw-black/5">
          <div className="flex justify-between text-xs text-pw-black/60 mb-1">
            <span>
              Overall Progress
              {pipelineProgress.currentPhase && (
                <span className="ml-2 text-pw-black/40">
                  ({pipelineProgress.currentPhase})
                </span>
              )}
            </span>
            <span>{pipelineProgress.overallProgress}%</span>
          </div>
          <div className="h-1 bg-pw-black/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pw-accent to-pw-accent/70 transition-all duration-500"
              style={{ width: `${pipelineProgress.overallProgress}%` }}
            />
          </div>

          {/* Completed Phases */}
          {pipelineProgress.completedPhases.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {pipelineProgress.completedPhases.map((phase) => (
                <span
                  key={phase}
                  className="text-xs px-2 py-0.5 rounded-full bg-pw-accent/10 text-pw-accent"
                >
                  ✓ {phase}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
