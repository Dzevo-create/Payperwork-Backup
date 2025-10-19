/**
 * Progress Emitter Utility
 *
 * Standardized progress event emission for pipeline phases
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import type { ProgressCallback, PhaseProgressData, PipelinePhase, PhaseStatus } from '../types';

export class ProgressEmitter {
  constructor(private onProgress?: ProgressCallback) {}

  /**
   * Emit phase start event
   */
  phaseStarted(phase: PipelinePhase, additionalData?: Record<string, any>): void {
    this.emit({
      phase,
      status: 'started',
      ...additionalData,
    });
  }

  /**
   * Emit phase progress event
   */
  phaseProgress(phase: PipelinePhase, data: Record<string, any>): void {
    this.emit({
      phase,
      status: 'in_progress',
      ...data,
    });
  }

  /**
   * Emit phase completed event
   */
  phaseCompleted(phase: PipelinePhase, data: Record<string, any>): void {
    this.emit({
      phase,
      status: 'completed',
      ...data,
    });
  }

  /**
   * Emit phase failed event
   */
  phaseFailed(phase: PipelinePhase, error: Error | string): void {
    this.emit({
      phase,
      status: 'failed',
      error: error instanceof Error ? error.message : error,
    });
  }

  /**
   * Emit pipeline started
   */
  pipelineStarted(data: Record<string, any>): void {
    this.emit({
      phase: 'pipeline:started',
      ...data,
    });
  }

  /**
   * Emit pipeline completed
   */
  pipelineCompleted(data: Record<string, any>): void {
    this.emit({
      phase: 'pipeline:completed',
      ...data,
    });
  }

  /**
   * Emit error event
   */
  error(agent: string, error: Error | string): void {
    if (!this.onProgress) return;

    this.onProgress({
      type: 'agent:error',
      data: {
        agent,
        error: error instanceof Error ? error.message : error,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Internal emit method
   */
  private emit(data: PhaseProgressData): void {
    if (!this.onProgress) return;

    this.onProgress({
      type: 'agent:progress',
      data,
      timestamp: new Date().toISOString(),
    });
  }
}
