/**
 * Presentation Pipeline (Refactored)
 *
 * Main orchestrator for the complete presentation generation pipeline.
 * Coordinates all phases and provides a clean, modular architecture.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { ResearchPhase } from './phases/ResearchPhase';
import { TopicGenerationPhase } from './phases/TopicGenerationPhase';
import { ContentGenerationPhase } from './phases/ContentGenerationPhase';
import { PreProductionPhase } from './phases/PreProductionPhase';
import { ProgressEmitter } from './utils/progressEmitter';
import type {
  PresentationPipelineInput,
  PresentationPipelineOutput,
  AgentServiceContext,
  ProgressCallback,
  PipelineMetadata,
} from './types';

export class PresentationPipeline {
  private progressEmitter: ProgressEmitter;

  constructor(private onProgress?: ProgressCallback) {
    this.progressEmitter = new ProgressEmitter(onProgress);
  }

  /**
   * Execute complete presentation pipeline
   */
  async execute(
    input: PresentationPipelineInput,
    context: AgentServiceContext
  ): Promise<PresentationPipelineOutput> {
    const startTime = Date.now();
    const phaseTimes: PipelineMetadata['phaseTimes'] = {
      research: 0,
      topicGeneration: 0,
      contentGeneration: 0,
      preProduction: 0,
    };

    try {
      // Emit pipeline start
      this.progressEmitter.pipelineStarted({
        topic: input.topic,
        slideCount: input.slideCount || 10,
        enableResearch: input.enableResearch !== false,
      });

      // ============================================
      // PHASE 1: RESEARCH
      // ============================================
      const researchPhase = new ResearchPhase(this.onProgress, context.userId);
      const researchResult = await researchPhase.execute(input, context);

      if (researchResult) {
        phaseTimes.research = researchResult.duration;
      }

      // ============================================
      // PHASE 2: TOPIC GENERATION
      // ============================================
      const topicPhase = new TopicGenerationPhase(this.onProgress, context.userId);
      const topicResult = await topicPhase.execute(input, researchResult?.research);
      phaseTimes.topicGeneration = topicResult.duration;

      // ============================================
      // PHASE 3: CONTENT GENERATION
      // ============================================
      const contentPhase = new ContentGenerationPhase(this.onProgress, context.userId);
      const contentResult = await contentPhase.execute(
        topicResult.topics,
        researchResult?.research
      );
      phaseTimes.contentGeneration = contentResult.duration;

      // ============================================
      // PHASE 4: PRE-PRODUCTION
      // ============================================
      const preProductionPhase = new PreProductionPhase(this.onProgress, context.userId);
      const preProductionResult = await preProductionPhase.execute(
        contentResult.slides,
        researchResult?.research
      );
      phaseTimes.preProduction = preProductionResult.duration;

      // ============================================
      // FINAL OUTPUT
      // ============================================
      const totalTime = Date.now() - startTime;

      this.progressEmitter.pipelineCompleted({
        totalTime,
        phaseTimes,
        qualityScore: preProductionResult.qualityScore,
      });

      return {
        presentationId: context.presentationId || `pres-${Date.now()}`,
        topics: topicResult.topics,
        slides: contentResult.slides,
        research: researchResult?.research,
        metadata: {
          totalTime,
          phaseTimes,
          qualityScore: preProductionResult.qualityScore,
        },
      };
    } catch (error) {
      this.progressEmitter.error(
        'PresentationPipeline',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Quick generation mode (without research)
   */
  async quickGenerate(
    topic: string,
    slideCount: number,
    context: AgentServiceContext
  ): Promise<PresentationPipelineOutput> {
    return this.execute(
      {
        topic,
        slideCount,
        enableResearch: false,
      },
      context
    );
  }
}
