/**
 * Base Agent System - Type Definitions
 *
 * Core types for the multi-agent system architecture.
 * Provides foundational interfaces for agents, tools, and workflows.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 1: Base Agent System
 */

// ============================================
// Agent Configuration
// ============================================

export interface AgentConfig {
  /** Unique identifier for the agent */
  name: string;

  /** Human-readable description of agent's purpose */
  description: string;

  /** Version string (semver) */
  version: string;

  /** Optional metadata */
  metadata?: Record<string, any>;
}

// ============================================
// Execution Context
// ============================================

export interface AgentExecutionContext {
  /** User ID who initiated the request */
  userId: string;

  /** Unique session ID for tracking */
  sessionId: string;

  /** Presentation ID (if applicable) */
  presentationId?: string;

  /** Additional context data */
  metadata?: Record<string, any>;
}

// ============================================
// Agent Results
// ============================================

export interface AgentResult<T = any> {
  /** Whether execution was successful */
  success: boolean;

  /** Result data (if successful) */
  data?: T;

  /** Error message (if failed) */
  error?: string;

  /** Additional execution metadata */
  metadata?: {
    /** Execution time in milliseconds */
    executionTime?: number;

    /** Tokens used (for LLM calls) */
    tokensUsed?: number;

    /** Tools used during execution */
    toolsUsed?: string[];

    /** Any other metadata */
    [key: string]: any;
  };
}

// ============================================
// Tool Types
// ============================================

export interface ToolConfig {
  /** Unique tool name */
  name: string;

  /** Tool description */
  description: string;

  /** Version string */
  version: string;
}

export interface ToolResult<T = any> {
  /** Whether tool execution was successful */
  success: boolean;

  /** Result data */
  data?: T;

  /** Error message (if failed) */
  error?: string;

  /** Execution metadata */
  metadata?: Record<string, any>;
}

// ============================================
// Workflow Types
// ============================================

export interface WorkflowStep {
  /** Step identifier */
  id: string;

  /** Step name/title */
  name: string;

  /** Agent to execute this step */
  agentName: string;

  /** Input data for the agent */
  input: any;

  /** Execution context */
  context: AgentExecutionContext;

  /** Dependencies (step IDs that must complete first) */
  dependencies?: string[];

  /** Step status */
  status?: 'pending' | 'running' | 'completed' | 'failed';
}

export interface WorkflowPlan {
  /** Plan identifier */
  id: string;

  /** Plan name */
  name: string;

  /** Steps to execute */
  steps: WorkflowStep[];

  /** Total estimated time (milliseconds) */
  estimatedTime?: number;

  /** Plan metadata */
  metadata?: Record<string, any>;
}

export interface WorkflowResult {
  /** Plan that was executed */
  plan: WorkflowPlan;

  /** Results from each step */
  stepResults: Record<string, AgentResult>;

  /** Overall success status */
  success: boolean;

  /** Total execution time */
  executionTime: number;

  /** Any errors encountered */
  errors?: string[];
}

// ============================================
// Event Types (for WebSocket)
// ============================================

export interface AgentEvent {
  /** Event type */
  type: 'agent:started' | 'agent:completed' | 'agent:failed' | 'agent:progress';

  /** Agent name */
  agentName: string;

  /** Session ID */
  sessionId: string;

  /** Event data */
  data: any;

  /** Timestamp */
  timestamp: string;
}

export interface ToolEvent {
  /** Event type */
  type: 'tool:started' | 'tool:completed' | 'tool:failed';

  /** Tool name */
  toolName: string;

  /** Session ID */
  sessionId: string;

  /** Event data */
  data: any;

  /** Timestamp */
  timestamp: string;
}

// ============================================
// Logging Types
// ============================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AgentLogEntry {
  /** Log level */
  level: LogLevel;

  /** Agent name */
  agentName: string;

  /** Log message */
  message: string;

  /** Additional data */
  data?: any;

  /** Timestamp */
  timestamp: string;
}
