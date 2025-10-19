/**
 * Research Phase
 *
 * Phase 1: Gather information from multiple sources
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { ResearchService } from '../../ResearchService';
import { ProgressEmitter } from '../utils/progressEmitter';
import { AgentEventEmitter } from '../utils/agentEventEmitter';
import type {
  ResearchPhaseResult,
  PresentationPipelineInput,
  AgentServiceContext,
  ProgressCallback,
} from '../types';

export class ResearchPhase {
  private researchService: ResearchService;
  private progressEmitter: ProgressEmitter;
  private agentEmitter?: AgentEventEmitter;

  constructor(onProgress?: ProgressCallback) {
    this.researchService = new ResearchService();
    this.progressEmitter = new ProgressEmitter(onProgress);
  }

  /**
   * Execute research phase
   */
  async execute(
    input: PresentationPipelineInput,
    context: AgentServiceContext
  ): Promise<ResearchPhaseResult | null> {
    const { topic, researchDepth = 'medium', enableResearch = true } = input;

    // Skip if research is disabled
    if (!enableResearch) {
      return null;
    }

    const startTime = Date.now();

    // Initialize agent emitter
    this.agentEmitter = new AgentEventEmitter(context.userId);

    try {
      // Emit agent thinking
      this.agentEmitter.thinking(
        'ResearchAgent',
        `Currently researching "${topic}" to gather comprehensive and accurate information...`
      );

      // Emit agent status
      this.agentEmitter.status('ResearchAgent', 'working', 'researching', 0);

      this.progressEmitter.phaseStarted('research', {
        topic,
        depth: researchDepth,
      });

      const research = await this.researchService.conductResearch(
        {
          topic,
          depth: researchDepth,
          includeNews: false,
        },
        context,
        (event) => {
          // Forward research progress events
          this.progressEmitter.phaseProgress('research', {
            event: event.type,
            data: event.data,
          });

          // Emit agent-specific events
          if (event.type === 'research:source_found' && this.agentEmitter) {
            this.agentEmitter.sourceFound('ResearchAgent', {
              title: event.data.title || 'Unknown Source',
              url: event.data.url || '',
              snippet: event.data.snippet || '',
              relevance: event.data.relevance || 0.5,
            });

            this.agentEmitter.thinking(
              'ResearchAgent',
              `Reviewed ${event.data.title} - analyzing content for relevance...`
            );
          }
        }
      );

      const duration = Date.now() - startTime;

      // Emit agent completion
      if (this.agentEmitter) {
        this.agentEmitter.thinking(
          'ResearchAgent',
          `Research completed! Found ${research.sources.length} sources and ${research.keyFindings.length} key findings.`
        );
        this.agentEmitter.status('ResearchAgent', 'completed');
        this.agentEmitter.actionCompleted('ResearchAgent', 'researching', {
          sourceCount: research.sources.length,
          findingCount: research.keyFindings.length,
        });
      }

      this.progressEmitter.phaseCompleted('research', {
        sourceCount: research.sources.length,
        findingCount: research.keyFindings.length,
        duration,
      });

      return {
        research,
        duration,
      };
    } catch (error) {
      this.progressEmitter.phaseFailed(
        'research',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}
