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
import type {
  ResearchPhaseResult,
  PresentationPipelineInput,
  AgentServiceContext,
  ProgressCallback,
} from '../types';

export class ResearchPhase {
  private researchService: ResearchService;
  private progressEmitter: ProgressEmitter;

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

    try {
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
        }
      );

      const duration = Date.now() - startTime;

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
