/**
 * Presentation Service
 *
 * Orchestrates ResearchAgent and ContentWriterAgent to generate complete presentations.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { ResearchService } from './ResearchService';
import { ContentGenerationService } from './ContentGenerationService';
import type {
  AgentServiceContext,
  PresentationGenerationInput,
  PresentationGenerationOutput,
  ProgressCallback,
} from './types';

export class PresentationService {
  private researchService: ResearchService;
  private contentService: ContentGenerationService;

  constructor() {
    this.researchService = new ResearchService();
    this.contentService = new ContentGenerationService();
  }

  /**
   * Generate complete presentation with research
   */
  async generatePresentation(
    input: PresentationGenerationInput,
    context: AgentServiceContext,
    onProgress?: ProgressCallback
  ): Promise<PresentationGenerationOutput> {
    const { topic, slideCount = 10, audience, requirements } = input;
    const startTime = Date.now();

    try {
      // Step 1: Conduct research
      const research = await this.researchService.conductResearch(
        {
          topic,
          depth: 'medium',
          includeNews: false,
        },
        context,
        onProgress
      );

      // Step 2: Generate slides
      const contentResult = await this.contentService.generateSlideContent(
        {
          topic,
          slideCount,
          audience,
          enableResearch: true,
        },
        context,
        onProgress
      );

      const totalTime = Date.now() - startTime;

      return {
        presentationId: context.presentationId || `pres-${Date.now()}`,
        slides: contentResult.slides,
        research,
        metadata: {
          totalTime,
          agentsUsed: ['ResearchAgent', 'ContentWriterAgent'],
        },
      };
    } catch (error) {
      // Emit error
      onProgress?.({
        type: 'agent:error',
        data: {
          agent: 'PresentationService',
          error: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Generate presentation without research (faster)
   */
  async generateQuickPresentation(
    topic: string,
    slideCount: number,
    context: AgentServiceContext,
    onProgress?: ProgressCallback
  ): Promise<PresentationGenerationOutput> {
    const startTime = Date.now();

    try {
      // Generate slides without research
      const contentResult = await this.contentService.generateSlideContent(
        {
          topic,
          slideCount,
          enableResearch: false,
        },
        context,
        onProgress
      );

      const totalTime = Date.now() - startTime;

      return {
        presentationId: context.presentationId || `pres-${Date.now()}`,
        slides: contentResult.slides,
        metadata: {
          totalTime,
          agentsUsed: ['ContentWriterAgent'],
        },
      };
    } catch (error) {
      // Emit error
      onProgress?.({
        type: 'agent:error',
        data: {
          agent: 'PresentationService',
          error: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }
}
