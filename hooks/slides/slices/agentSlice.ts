/**
 * Agent Slice
 *
 * Manages agent system state (Manus AI integration).
 * Tracks agent status, insights, research sources, and pipeline progress.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { StateCreator } from 'zustand';
import {
  AgentType,
  AgentState,
  AgentInsight,
  ResearchSource,
  PipelineProgress,
} from '@/types/slides';
import { slidesLogger } from '@/lib/logger';

// ============================================
// Agent Slice State
// ============================================

export interface AgentSlice {
  // State
  agentStatus: Record<AgentType, AgentState>;
  currentAgent: AgentType | null;
  agentInsights: AgentInsight[];
  researchSources: ResearchSource[];
  pipelineProgress: PipelineProgress;

  // Actions
  updateAgentStatus: (agent: AgentType, updates: Partial<AgentState>) => void;
  setCurrentAgent: (agent: AgentType | null) => void;
  addAgentInsight: (insight: AgentInsight) => void;
  addResearchSource: (source: ResearchSource) => void;
  clearResearchSources: () => void;
  updatePipelineProgress: (updates: Partial<PipelineProgress>) => void;
  resetAgentState: () => void;
}

// ============================================
// Initial Agent State
// ============================================

const initialAgentStatus: Record<AgentType, AgentState> = {
  ResearchAgent: { agent: 'ResearchAgent', status: 'idle' },
  TopicAgent: { agent: 'TopicAgent', status: 'idle' },
  ContentAgent: { agent: 'ContentAgent', status: 'idle' },
  DesignerAgent: { agent: 'DesignerAgent', status: 'idle' },
  QualityAgent: { agent: 'QualityAgent', status: 'idle' },
  OrchestratorAgent: { agent: 'OrchestratorAgent', status: 'idle' },
};

const initialPipelineProgress: PipelineProgress = {
  currentPhase: null,
  completedPhases: [],
  overallProgress: 0,
};

// ============================================
// Agent Slice Creator
// ============================================

export const createAgentSlice: StateCreator<AgentSlice, [], [], AgentSlice> = (
  set
) => ({
  // Initial State
  agentStatus: initialAgentStatus,
  currentAgent: null,
  agentInsights: [],
  researchSources: [],
  pipelineProgress: initialPipelineProgress,

  // Actions
  updateAgentStatus: (agent, updates) => {
    slidesLogger.debug('Updating agent status', {
      action: 'updateAgentStatus',
      agent,
      updates,
    });
    set((state) => ({
      agentStatus: {
        ...state.agentStatus,
        [agent]: {
          ...state.agentStatus[agent],
          ...updates,
        },
      },
    }));
  },

  setCurrentAgent: (agent) => {
    slidesLogger.debug('Setting current agent', {
      action: 'setCurrentAgent',
      agent,
    });
    set({ currentAgent: agent });
  },

  addAgentInsight: (insight) => {
    slidesLogger.debug('Adding agent insight', {
      action: 'addAgentInsight',
      agent: insight.agent,
      confidence: insight.confidence,
    });
    set((state) => ({
      agentInsights: [...state.agentInsights, insight],
    }));
  },

  addResearchSource: (source) => {
    slidesLogger.debug('Adding research source', {
      action: 'addResearchSource',
      title: source.title,
      relevance: source.relevance,
    });
    set((state) => ({
      researchSources: [...state.researchSources, source],
    }));
  },

  clearResearchSources: () => {
    slidesLogger.debug('Clearing research sources', {
      action: 'clearResearchSources',
    });
    set({ researchSources: [] });
  },

  updatePipelineProgress: (updates) => {
    slidesLogger.debug('Updating pipeline progress', {
      action: 'updatePipelineProgress',
      updates,
    });
    set((state) => ({
      pipelineProgress: {
        ...state.pipelineProgress,
        ...updates,
      },
    }));
  },

  resetAgentState: () => {
    slidesLogger.debug('Resetting agent state', {
      action: 'resetAgentState',
    });
    set({
      agentStatus: initialAgentStatus,
      currentAgent: null,
      agentInsights: [],
      researchSources: [],
      pipelineProgress: initialPipelineProgress,
    });
  },
});
