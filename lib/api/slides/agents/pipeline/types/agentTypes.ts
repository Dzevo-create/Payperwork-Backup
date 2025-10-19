/**
 * Agent Types for Generative UI
 *
 * Defines all agent-related types for the multi-agent system
 * with visible agent activities and status tracking.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

// ============================================
// Agent Definitions
// ============================================

export type AgentType =
  | 'ResearchAgent'
  | 'TopicAgent'
  | 'ContentAgent'
  | 'DesignerAgent'
  | 'QualityAgent'
  | 'OrchestratorAgent';

export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'working'
  | 'waiting'
  | 'completed'
  | 'error';

export type AgentAction =
  | 'researching'
  | 'analyzing'
  | 'planning'
  | 'generating'
  | 'reviewing'
  | 'optimizing'
  | 'validating';

// ============================================
// Agent Metadata
// ============================================

export interface AgentMetadata {
  type: AgentType;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
  capabilities: string[];
}

export const AGENT_REGISTRY: Record<AgentType, AgentMetadata> = {
  ResearchAgent: {
    type: 'ResearchAgent',
    name: 'Research Agent',
    description: 'Gathers information from multiple sources',
    icon: 'Search',
    color: 'blue',
    capabilities: ['web_search', 'source_analysis', 'fact_verification'],
  },
  TopicAgent: {
    type: 'TopicAgent',
    name: 'Topic Agent',
    description: 'Creates structured presentation outline',
    icon: 'FileText',
    color: 'green',
    capabilities: ['outline_generation', 'structure_planning', 'topic_organization'],
  },
  ContentAgent: {
    type: 'ContentAgent',
    name: 'Content Agent',
    description: 'Generates detailed slide content',
    icon: 'PenTool',
    color: 'purple',
    capabilities: ['content_writing', 'storytelling', 'context_integration'],
  },
  DesignerAgent: {
    type: 'DesignerAgent',
    name: 'Designer Agent',
    description: 'Creates visual layouts and designs',
    icon: 'Palette',
    color: 'pink',
    capabilities: ['layout_design', 'visual_composition', 'style_application'],
  },
  QualityAgent: {
    type: 'QualityAgent',
    name: 'Quality Agent',
    description: 'Validates and scores presentation quality',
    icon: 'CheckCircle',
    color: 'orange',
    capabilities: ['quality_checks', 'consistency_validation', 'scoring'],
  },
  OrchestratorAgent: {
    type: 'OrchestratorAgent',
    name: 'Orchestrator',
    description: 'Coordinates all agents and workflow',
    icon: 'Brain',
    color: 'indigo',
    capabilities: ['workflow_management', 'agent_coordination', 'decision_making'],
  },
};

// ============================================
// Agent Events
// ============================================

export interface AgentThinkingEvent {
  type: 'agent:thinking';
  agent: AgentType;
  content: string;
  timestamp: string;
  messageId: string;
}

export interface AgentActionEvent {
  type: 'agent:action';
  agent: AgentType;
  action: AgentAction;
  status: 'started' | 'progress' | 'completed' | 'failed';
  data?: Record<string, any>;
  timestamp: string;
  messageId: string;
}

export interface AgentStatusEvent {
  type: 'agent:status';
  agent: AgentType;
  status: AgentStatus;
  currentAction?: AgentAction;
  progress?: number;
  timestamp: string;
}

export interface AgentSourceFoundEvent {
  type: 'agent:source:found';
  agent: AgentType;
  source: {
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  };
  timestamp: string;
  messageId: string;
}

export interface AgentInsightEvent {
  type: 'agent:insight';
  agent: AgentType;
  insight: string;
  confidence: number;
  timestamp: string;
  messageId: string;
}

export type AgentEvent =
  | AgentThinkingEvent
  | AgentActionEvent
  | AgentStatusEvent
  | AgentSourceFoundEvent
  | AgentInsightEvent;

// ============================================
// Agent State
// ============================================

export interface AgentState {
  agent: AgentType;
  status: AgentStatus;
  currentAction?: AgentAction;
  progress?: number;
  startTime?: string;
  endTime?: string;
  output?: any;
  error?: string;
}

export interface AgentWorkflowState {
  agents: Record<AgentType, AgentState>;
  currentAgent?: AgentType;
  completedAgents: AgentType[];
  failedAgents: AgentType[];
}

// ============================================
// Agent Communication
// ============================================

export interface AgentMessage {
  from: AgentType;
  to?: AgentType; // undefined = broadcast
  type: 'request' | 'response' | 'notification';
  content: any;
  timestamp: string;
}

export interface AgentContext {
  userId: string;
  sessionId: string;
  presentationId?: string;
  sharedMemory: Map<string, any>;
  messageHistory: AgentMessage[];
}

// ============================================
// Helper Functions
// ============================================

export function getAgentMetadata(agent: AgentType): AgentMetadata {
  return AGENT_REGISTRY[agent];
}

export function getAgentIcon(agent: AgentType): string {
  return AGENT_REGISTRY[agent].icon;
}

export function getAgentColor(agent: AgentType): string {
  return AGENT_REGISTRY[agent].color;
}

export function getAgentName(agent: AgentType): string {
  return AGENT_REGISTRY[agent].name;
}

export function getAgentDescription(agent: AgentType): string {
  return AGENT_REGISTRY[agent].description;
}

// ============================================
// Agent Event Builders
// ============================================

export function createThinkingEvent(
  agent: AgentType,
  content: string
): AgentThinkingEvent {
  return {
    type: 'agent:thinking',
    agent,
    content,
    timestamp: new Date().toISOString(),
    messageId: `thinking-${agent}-${Date.now()}`,
  };
}

export function createActionEvent(
  agent: AgentType,
  action: AgentAction,
  status: 'started' | 'progress' | 'completed' | 'failed',
  data?: Record<string, any>
): AgentActionEvent {
  return {
    type: 'agent:action',
    agent,
    action,
    status,
    data,
    timestamp: new Date().toISOString(),
    messageId: `action-${agent}-${action}-${Date.now()}`,
  };
}

export function createStatusEvent(
  agent: AgentType,
  status: AgentStatus,
  currentAction?: AgentAction,
  progress?: number
): AgentStatusEvent {
  return {
    type: 'agent:status',
    agent,
    status,
    currentAction,
    progress,
    timestamp: new Date().toISOString(),
  };
}

export function createSourceFoundEvent(
  agent: AgentType,
  source: {
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  }
): AgentSourceFoundEvent {
  return {
    type: 'agent:source:found',
    agent,
    source,
    timestamp: new Date().toISOString(),
    messageId: `source-${agent}-${Date.now()}`,
  };
}

export function createInsightEvent(
  agent: AgentType,
  insight: string,
  confidence: number
): AgentInsightEvent {
  return {
    type: 'agent:insight',
    agent,
    insight,
    confidence,
    timestamp: new Date().toISOString(),
    messageId: `insight-${agent}-${Date.now()}`,
  };
}
