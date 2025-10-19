/**
 * Agent Event Emitter
 *
 * Handles emission of agent events to WebSocket for real-time UI updates.
 * Provides a clean interface for agents to communicate their status and actions.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import type {
  AgentType,
  AgentAction,
  AgentStatus,
  AgentEvent,
  AgentThinkingEvent,
  AgentActionEvent,
  AgentStatusEvent,
  AgentSourceFoundEvent,
  AgentInsightEvent,
} from '../types/agentTypes';
import {
  createThinkingEvent,
  createActionEvent,
  createStatusEvent,
  createSourceFoundEvent,
  createInsightEvent,
} from '../types/agentTypes';

// ============================================
// Safe Socket Import (works in Next.js)
// ============================================

let emitToUser: Function | undefined;

try {
  const socketServer = require('@/lib/socket/server');
  emitToUser = socketServer.emitToUser;
} catch (error) {
  console.warn('[AgentEventEmitter] Socket.IO server not available (OK for development)');
}

// ============================================
// Agent Event Emitter Class
// ============================================

export class AgentEventEmitter {
  constructor(private userId: string) {}

  /**
   * Emit agent thinking step
   */
  thinking(agent: AgentType, content: string): void {
    const event = createThinkingEvent(agent, content);
    this.emitEvent(event);
    console.log(`🤖 ${agent} thinking:`, content);
  }

  /**
   * Emit agent action started
   */
  actionStarted(agent: AgentType, action: AgentAction, data?: Record<string, any>): void {
    const event = createActionEvent(agent, action, 'started', data);
    this.emitEvent(event);
    console.log(`🚀 ${agent} started ${action}`);
  }

  /**
   * Emit agent action progress
   */
  actionProgress(
    agent: AgentType,
    action: AgentAction,
    data?: Record<string, any>
  ): void {
    const event = createActionEvent(agent, action, 'progress', data);
    this.emitEvent(event);
    console.log(`⏳ ${agent} progress on ${action}:`, data);
  }

  /**
   * Emit agent action completed
   */
  actionCompleted(
    agent: AgentType,
    action: AgentAction,
    data?: Record<string, any>
  ): void {
    const event = createActionEvent(agent, action, 'completed', data);
    this.emitEvent(event);
    console.log(`✅ ${agent} completed ${action}`);
  }

  /**
   * Emit agent action failed
   */
  actionFailed(
    agent: AgentType,
    action: AgentAction,
    error: string
  ): void {
    const event = createActionEvent(agent, action, 'failed', { error });
    this.emitEvent(event);
    console.error(`❌ ${agent} failed ${action}:`, error);
  }

  /**
   * Emit agent status change
   */
  status(
    agent: AgentType,
    status: AgentStatus,
    currentAction?: AgentAction,
    progress?: number
  ): void {
    const event = createStatusEvent(agent, status, currentAction, progress);
    this.emitEvent(event);
    console.log(`📊 ${agent} status: ${status}`, { currentAction, progress });
  }

  /**
   * Emit research source found
   */
  sourceFound(
    agent: AgentType,
    source: {
      title: string;
      url: string;
      snippet: string;
      relevance: number;
    }
  ): void {
    const event = createSourceFoundEvent(agent, source);
    this.emitEvent(event);
    console.log(`🔍 ${agent} found source:`, source.title);
  }

  /**
   * Emit agent insight
   */
  insight(agent: AgentType, insight: string, confidence: number): void {
    const event = createInsightEvent(agent, insight, confidence);
    this.emitEvent(event);
    console.log(`💡 ${agent} insight (${confidence}%):`, insight);
  }

  /**
   * Emit custom event
   */
  custom(eventType: string, data: any): void {
    emitToUser?.(this.userId, eventType, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    console.log(`📡 Custom event: ${eventType}`, data);
  }

  /**
   * Internal: Emit event to WebSocket
   */
  private emitEvent(event: AgentEvent): void {
    // Map event type to WebSocket event name
    const eventName = this.getEventName(event.type);

    // Emit to user via WebSocket (safe optional call)
    emitToUser?.(this.userId, eventName, event);
  }

  /**
   * Map internal event type to WebSocket event name
   */
  private getEventName(type: AgentEvent['type']): string {
    const mapping: Record<AgentEvent['type'], string> = {
      'agent:thinking': 'agent:thinking:step',
      'agent:action': 'agent:action:update',
      'agent:status': 'agent:status:change',
      'agent:source:found': 'agent:source:found',
      'agent:insight': 'agent:insight:generated',
    };
    return mapping[type];
  }
}

// ============================================
// Convenience Functions
// ============================================

/**
 * Create agent event emitter for a user
 */
export function createAgentEmitter(userId: string): AgentEventEmitter {
  return new AgentEventEmitter(userId);
}

/**
 * Emit thinking step (shorthand)
 */
export function emitThinking(
  userId: string,
  agent: AgentType,
  content: string
): void {
  const emitter = new AgentEventEmitter(userId);
  emitter.thinking(agent, content);
}

/**
 * Emit action started (shorthand)
 */
export function emitActionStarted(
  userId: string,
  agent: AgentType,
  action: AgentAction,
  data?: Record<string, any>
): void {
  const emitter = new AgentEventEmitter(userId);
  emitter.actionStarted(agent, action, data);
}

/**
 * Emit action completed (shorthand)
 */
export function emitActionCompleted(
  userId: string,
  agent: AgentType,
  action: AgentAction,
  data?: Record<string, any>
): void {
  const emitter = new AgentEventEmitter(userId);
  emitter.actionCompleted(agent, action, data);
}

/**
 * Emit source found (shorthand)
 */
export function emitSourceFound(
  userId: string,
  agent: AgentType,
  source: {
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  }
): void {
  const emitter = new AgentEventEmitter(userId);
  emitter.sourceFound(agent, source);
}
