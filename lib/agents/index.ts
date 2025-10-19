/**
 * Multi-Agent System - Public API
 *
 * Complete Multi-Agent System inspired by Manus.ai
 *
 * Architecture:
 * - Base System: BaseAgent, BaseTool, AgentOrchestrator
 * - Core Tools: LLMTool, SearchTool, BrowserTool
 * - Specialized Agents: CoordinatorAgent, ContentWriterAgent, ResearchAgent
 *
 * Usage Examples:
 *
 * ```typescript
 * // Simple usage with ContentWriter
 * import { ContentWriterAgent } from '@/lib/agents';
 *
 * const writer = new ContentWriterAgent();
 * const result = await writer.execute({
 *   topic: 'AI in Healthcare',
 *   contentType: 'article',
 *   enableResearch: true,
 * }, context);
 * ```
 *
 * ```typescript
 * // Advanced usage with Coordinator
 * import { CoordinatorAgent } from '@/lib/agents';
 *
 * const coordinator = new CoordinatorAgent();
 * const result = await coordinator.execute({
 *   task: 'Create presentation about AI trends',
 *   taskType: 'presentation',
 *   audience: 'business executives',
 * }, context);
 * ```
 *
 * ```typescript
 * // Custom workflow with Orchestrator
 * import { AgentOrchestrator, ResearchAgent, ContentWriterAgent } from '@/lib/agents';
 *
 * const orchestrator = new AgentOrchestrator({ name: 'MyOrchestrator' });
 * orchestrator.registerAgent('research', new ResearchAgent());
 * orchestrator.registerAgent('writer', new ContentWriterAgent());
 *
 * const plan = {
 *   id: 'custom-plan',
 *   name: 'Custom Workflow',
 *   steps: [
 *     {
 *       id: 'step-1',
 *       name: 'research',
 *       agentName: 'research',
 *       input: { topic: 'AI', depth: 'deep' },
 *       context,
 *     },
 *     {
 *       id: 'step-2',
 *       name: 'write',
 *       agentName: 'writer',
 *       input: { topic: 'AI', contentType: 'article' },
 *       context,
 *       dependencies: ['research'],
 *     },
 *   ],
 * };
 *
 * const result = await orchestrator.executeWorkflow(plan);
 * ```
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @version 1.0.0
 */

// ============================================
// Base System
// ============================================

export {
  BaseAgent,
  BaseTool,
  AgentOrchestrator,
} from './base';

export type {
  AgentConfig,
  AgentExecutionContext,
  AgentResult,
  AgentLogEntry,
  LogLevel,
  ToolConfig,
  ToolResult,
  WorkflowStep,
  WorkflowPlan,
  WorkflowResult,
  AgentEvent,
  ToolEvent,
  OrchestratorConfig,
} from './base';

// ============================================
// Core Tools
// ============================================

export {
  LLMTool,
  SearchTool,
  BrowserTool,
} from './tools';

export type {
  LLMToolInput,
  LLMToolOutput,
  SearchToolInput,
  SearchToolOutput,
  SearchResult,
  BrowserToolInput,
  BrowserToolOutput,
  PageMetadata,
} from './tools';

// ============================================
// Specialized Agents
// ============================================

export {
  CoordinatorAgent,
  ContentWriterAgent,
  ResearchAgent,
} from './agents';

export type {
  CoordinatorInput,
  CoordinatorOutput,
  ContentWriterInput,
  ContentWriterOutput,
  ResearchAgentInput,
  ResearchAgentOutput,
  ResearchSource,
} from './agents';
