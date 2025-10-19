/**
 * Presentation Pipeline - Module Exports
 *
 * Clean exports for the refactored modular pipeline
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

// Main Pipeline
export { PresentationPipeline } from './PresentationPipeline';

// Phase Modules
export { ResearchPhase } from './phases/ResearchPhase';
export { TopicGenerationPhase } from './phases/TopicGenerationPhase';
export { ContentGenerationPhase } from './phases/ContentGenerationPhase';
export { PreProductionPhase } from './phases/PreProductionPhase';

// Utilities
export { ProgressEmitter } from './utils/progressEmitter';
export { ContextBuilder } from './utils/contextBuilder';
export { QualityScorer } from './utils/qualityScorer';

// Types
export type {
  PresentationPipelineInput,
  PresentationPipelineOutput,
  TopicWithResearch,
  PipelineMetadata,
  ResearchPhaseResult,
  TopicGenerationPhaseResult,
  ContentGenerationPhaseResult,
  PreProductionPhaseResult,
  PipelinePhase,
  PhaseStatus,
  AgentServiceContext,
  ResearchServiceOutput,
  SlideContent,
  ProgressCallback,
} from './types';
