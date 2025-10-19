/**
 * Multi-Agent Service - Type Definitions
 *
 * Types for integrating the Multi-Agent System into Slides workflow.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

// ============================================
// Agent Service Input/Output Types
// ============================================

export interface AgentServiceContext {
  userId: string;
  sessionId: string;
  presentationId?: string;
}

export interface ResearchServiceInput {
  topic: string;
  depth?: 'quick' | 'medium' | 'deep';
  includeNews?: boolean;
}

export interface ResearchServiceOutput {
  summary: string;
  keyFindings: string[];
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

export interface ContentGenerationInput {
  topic: string;
  slideCount?: number;
  audience?: string;
  tone?: 'professional' | 'casual' | 'academic';
  enableResearch?: boolean;
}

export interface SlideContent {
  title: string;
  content: string;
  bulletPoints?: string[];
  notes?: string;
}

export interface ContentGenerationOutput {
  slides: SlideContent[];
  metadata: {
    totalSlides: number;
    wordCount: number;
    researchSources?: string[];
  };
}

export interface PresentationGenerationInput {
  topic: string;
  slideCount?: number;
  audience?: string;
  requirements?: string[];
}

export interface PresentationGenerationOutput {
  presentationId: string;
  slides: SlideContent[];
  research?: ResearchServiceOutput;
  metadata: {
    totalTime: number;
    agentsUsed: string[];
  };
}

// ============================================
// Progress Event Types
// ============================================

export interface AgentProgressEvent {
  type: 'research:started' | 'research:completed' | 'content:started' | 'content:completed' | 'agent:progress' | 'agent:error';
  data: any;
  timestamp: string;
}

export type ProgressCallback = (event: AgentProgressEvent) => void;
