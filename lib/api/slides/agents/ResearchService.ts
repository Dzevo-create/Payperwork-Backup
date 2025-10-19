/**
 * Research Service
 *
 * Service layer for integrating ResearchAgent into Slides workflow.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { ResearchAgent } from '@/lib/agents/agents/ResearchAgent';
import type { AgentExecutionContext } from '@/lib/agents/base';
import type {
  AgentServiceContext,
  ResearchServiceInput,
  ResearchServiceOutput,
  ProgressCallback,
} from './types';

export class ResearchService {
  private agent: ResearchAgent;

  constructor() {
    this.agent = new ResearchAgent();
  }

  /**
   * Conduct research for a presentation topic
   */
  async conductResearch(
    input: ResearchServiceInput,
    context: AgentServiceContext,
    onProgress?: ProgressCallback
  ): Promise<ResearchServiceOutput> {
    const { topic, depth = 'medium', includeNews = false } = input;

    // Emit progress: research started
    onProgress?.({
      type: 'research:started',
      data: { topic, depth },
      timestamp: new Date().toISOString(),
    });

    // Convert to agent context
    const agentContext: AgentExecutionContext = {
      userId: context.userId,
      sessionId: context.sessionId,
      presentationId: context.presentationId,
    };

    try {
      // Execute research agent
      const result = await this.agent.execute(
        {
          topic,
          depth,
          includeNews,
        },
        agentContext
      );

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Research failed');
      }

      // Emit progress: research completed
      onProgress?.({
        type: 'research:completed',
        data: {
          sourceCount: result.data.sources.length,
          findingCount: result.data.keyFindings.length,
        },
        timestamp: new Date().toISOString(),
      });

      // Convert to service output
      return {
        summary: result.data.summary,
        keyFindings: result.data.keyFindings,
        sources: result.data.sources.map((s) => ({
          title: s.title,
          url: s.url,
          snippet: s.snippet,
        })),
      };
    } catch (error) {
      // Emit error
      onProgress?.({
        type: 'agent:error',
        data: {
          agent: 'ResearchAgent',
          error: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Quick research (for fast topic exploration)
   */
  async quickResearch(
    topic: string,
    context: AgentServiceContext
  ): Promise<ResearchServiceOutput> {
    return this.conductResearch(
      { topic, depth: 'quick' },
      context
    );
  }
}
