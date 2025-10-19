/**
 * Specialized Agents - Public API
 *
 * Exports all specialized agents for the Multi-Agent System.
 *
 * Usage:
 * ```typescript
 * import { CoordinatorAgent, ContentWriterAgent, ResearchAgent } from '@/lib/agents/agents';
 * ```
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Agent Implementation
 */

// ============================================
// Specialized Agents
// ============================================

export { CoordinatorAgent } from './CoordinatorAgent';
export { ContentWriterAgent } from './ContentWriterAgent';
export { ResearchAgent } from './ResearchAgent';

// ============================================
// Type Exports
// ============================================

export type {
  CoordinatorInput,
  CoordinatorOutput,
} from './CoordinatorAgent';

export type {
  ContentWriterInput,
  ContentWriterOutput,
} from './ContentWriterAgent';

export type {
  ResearchAgentInput,
  ResearchAgentOutput,
  ResearchSource,
} from './ResearchAgent';
