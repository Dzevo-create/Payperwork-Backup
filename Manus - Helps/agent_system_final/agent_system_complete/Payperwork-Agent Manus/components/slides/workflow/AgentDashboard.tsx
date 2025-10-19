/**
 * Agent Dashboard Component
 *
 * Displays all active agents and their current status.
 * Shows pipeline progress and research sources.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

'use client';

import React from 'react';
import { useSlidesStore } from '@/hooks/slides/useSlidesStore';
import { AgentStatusCard } from './AgentStatusCard';
import { PipelineProgress } from './PipelineProgress';
import { ResearchSourceList } from './messages/ResearchSourceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AgentDashboard() {
  const agentStatus = useSlidesStore((state) => state.agentStatus);
  const researchSources = useSlidesStore((state) => state.researchSources);
  const pipelineProgress = useSlidesStore((state) => state.pipelineProgress);

  const agents = [
    'ResearchAgent',
    'TopicAgent',
    'ContentAgent',
    'DesignerAgent',
    'QualityAgent',
  ];

  const hasActiveAgents = Object.keys(agentStatus).length > 0;

  if (!hasActiveAgents) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Pipeline Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pipeline Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineProgress
            currentPhase={pipelineProgress.currentPhase}
            completedPhases={pipelineProgress.completedPhases}
            overallProgress={pipelineProgress.overallProgress}
          />
        </CardContent>
      </Card>

      {/* Active Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Active Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map((agent) => {
              const status = agentStatus[agent];
              if (!status) return null;

              return (
                <AgentStatusCard
                  key={agent}
                  agent={agent}
                  status={status.status}
                  currentAction={status.currentAction as any}
                  progress={status.progress}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Research Sources */}
      {researchSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Research Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResearchSourceList sources={researchSources} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

