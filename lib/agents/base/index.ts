/**
 * Base Agent System - Public API
 *
 * Exports all base classes, types, and utilities for the Multi-Agent System.
 *
 * Usage:
 * ```typescript
 * import { BaseAgent, BaseTool, AgentOrchestrator } from '@/lib/agents/base';
 * import type { AgentConfig, ToolConfig, WorkflowPlan } from '@/lib/agents/base';
 * ```
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 1: Base Agent System
 */

// ============================================
// Core Classes
// ============================================

export { BaseAgent } from './BaseAgent';
export { BaseTool } from './BaseTool';
export { AgentOrchestrator } from './AgentOrchestrator';

// ============================================
// Type Definitions
// ============================================

export type {
  // Agent Types
  AgentConfig,
  AgentExecutionContext,
  AgentResult,
  AgentLogEntry,
  LogLevel,

  // Tool Types
  ToolConfig,
  ToolResult,

  // Workflow Types
  WorkflowStep,
  WorkflowPlan,
  WorkflowResult,

  // Event Types (for WebSocket)
  AgentEvent,
  ToolEvent,
} from './types';

export type { OrchestratorConfig } from './AgentOrchestrator';
