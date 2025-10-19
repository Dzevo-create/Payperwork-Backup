/**
 * Multi-Agent Services - Public API
 *
 * Exports all agent services for Slides workflow integration.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

export { ResearchService } from './ResearchService';
export { ContentGenerationService } from './ContentGenerationService';
export { PresentationService } from './PresentationService';
export { PresentationPipelineService } from './PresentationPipelineService';
export type { PresentationPipelineInput, PresentationPipelineOutput, TopicWithResearch } from './PresentationPipelineService';

export type {
  AgentServiceContext,
  ResearchServiceInput,
  ResearchServiceOutput,
  ContentGenerationInput,
  ContentGenerationOutput,
  SlideContent,
  PresentationGenerationInput,
  PresentationGenerationOutput,
  AgentProgressEvent,
  ProgressCallback,
} from './types';
