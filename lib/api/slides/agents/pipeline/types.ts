/**
 * Pipeline Types
 *
 * Shared types for the Presentation Pipeline
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import type {
  AgentServiceContext,
  ResearchServiceOutput,
  SlideContent,
  ProgressCallback,
} from '../types';

// Re-export shared types
export type { AgentServiceContext, ResearchServiceOutput, SlideContent, ProgressCallback };

// ============================================
// Pipeline Input/Output
// ============================================

export interface PresentationPipelineInput {
  /** Main topic/prompt for the presentation */
  topic: string;

  /** Number of slides to generate (default: 10) */
  slideCount?: number;

  /** Target audience */
  audience?: string;

  /** Presentation format (16:9, 4:3, etc.) */
  format?: string;

  /** Theme/style */
  theme?: string;

  /** Enable deep research (default: true) */
  enableResearch?: boolean;

  /** Research depth (quick, medium, deep) */
  researchDepth?: 'quick' | 'medium' | 'deep';
}

export interface PresentationPipelineOutput {
  presentationId: string;
  topics: TopicWithResearch[];
  slides: SlideContent[];
  research?: ResearchServiceOutput;
  metadata: PipelineMetadata;
}

// ============================================
// Phase-specific Types
// ============================================

export interface TopicWithResearch {
  order: number;
  title: string;
  description: string;
  keyPoints: string[];
  relevantSources?: string[];
}

export interface PipelineMetadata {
  totalTime: number;
  phaseTimes: {
    research: number;
    topicGeneration: number;
    contentGeneration: number;
    preProduction: number;
  };
  qualityScore?: number;
}

// ============================================
// Progress Event Types
// ============================================

export type PipelinePhase =
  | 'pipeline:started'
  | 'research'
  | 'topic_generation'
  | 'content_generation'
  | 'pre_production'
  | 'pipeline:completed';

export type PhaseStatus = 'started' | 'in_progress' | 'completed' | 'failed';

export interface PhaseProgressData {
  phase: PipelinePhase | string;
  status?: PhaseStatus;
  [key: string]: any;
}

// ============================================
// Phase Result Types
// ============================================

export interface ResearchPhaseResult {
  research: ResearchServiceOutput;
  duration: number;
}

export interface TopicGenerationPhaseResult {
  topics: TopicWithResearch[];
  duration: number;
}

export interface ContentGenerationPhaseResult {
  slides: SlideContent[];
  duration: number;
}

export interface PreProductionPhaseResult {
  qualityScore: number;
  duration: number;
  issues?: string[];
}
