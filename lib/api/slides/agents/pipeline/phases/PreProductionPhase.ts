/**
 * Pre-Production Phase
 *
 * Phase 4: Quality checks and finalization
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { QualityScorer } from '../utils/qualityScorer';
import { ProgressEmitter } from '../utils/progressEmitter';
import type {
  PreProductionPhaseResult,
  SlideContent,
  ResearchServiceOutput,
  ProgressCallback,
} from '../types';

export class PreProductionPhase {
  private progressEmitter: ProgressEmitter;

  constructor(onProgress?: ProgressCallback) {
    this.progressEmitter = new ProgressEmitter(onProgress);
  }

  /**
   * Execute pre-production phase
   */
  async execute(
    slides: SlideContent[],
    research?: ResearchServiceOutput
  ): Promise<PreProductionPhaseResult> {
    const startTime = Date.now();

    try {
      this.progressEmitter.phaseStarted('pre_production', {
        slideCount: slides.length,
      });

      // Calculate quality score
      const qualityResult = QualityScorer.calculate(slides, research);
      const duration = Date.now() - startTime;

      this.progressEmitter.phaseCompleted('pre_production', {
        qualityScore: qualityResult.score,
        qualityLevel: QualityScorer.getQualityLevel(qualityResult.score),
        checks: qualityResult.checks,
        issueCount: qualityResult.issues.length,
        duration,
      });

      return {
        qualityScore: qualityResult.score,
        duration,
        issues: qualityResult.issues,
      };
    } catch (error) {
      this.progressEmitter.phaseFailed(
        'pre_production',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}
