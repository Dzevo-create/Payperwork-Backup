/**
 * Presentation Pipeline Service
 *
 * Orchestrates the complete presentation generation pipeline:
 * 1. Research - Gather information from multiple sources
 * 2. Topic Generation - Create structured presentation outline
 * 3. Content Generation - Generate detailed slide content
 * 4. Pre-Production - Quality checks and finalization
 *
 * Inspired by Manus AI's multi-agent architecture.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { ResearchService } from './ResearchService';
import { ContentGenerationService } from './ContentGenerationService';
import { LLMTool } from '@/lib/agents/tools/LLMTool';
import type {
  AgentServiceContext,
  ResearchServiceOutput,
  SlideContent,
  ProgressCallback,
} from './types';

// ============================================
// Pipeline Input/Output Types
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

export interface TopicWithResearch {
  order: number;
  title: string;
  description: string;
  keyPoints: string[];
  relevantSources?: string[];
}

export interface PresentationPipelineOutput {
  presentationId: string;
  topics: TopicWithResearch[];
  slides: SlideContent[];
  research?: ResearchServiceOutput;
  metadata: {
    totalTime: number;
    phaseTimes: {
      research: number;
      topicGeneration: number;
      contentGeneration: number;
      preProduction: number;
    };
    qualityScore?: number;
  };
}

// ============================================
// Presentation Pipeline Service
// ============================================

export class PresentationPipelineService {
  private researchService: ResearchService;
  private contentService: ContentGenerationService;
  private llmTool: LLMTool;

  constructor() {
    this.researchService = new ResearchService();
    this.contentService = new ContentGenerationService();
    this.llmTool = new LLMTool();
  }

  /**
   * Execute complete presentation pipeline
   */
  async execute(
    input: PresentationPipelineInput,
    context: AgentServiceContext,
    onProgress?: ProgressCallback
  ): Promise<PresentationPipelineOutput> {
    const startTime = Date.now();
    const phaseTimes = {
      research: 0,
      topicGeneration: 0,
      contentGeneration: 0,
      preProduction: 0,
    };

    try {
      const {
        topic,
        slideCount = 10,
        enableResearch = true,
        researchDepth = 'medium',
      } = input;

      // Emit pipeline start
      onProgress?.({
        type: 'agent:progress',
        data: {
          phase: 'pipeline:started',
          topic,
          slideCount,
        },
        timestamp: new Date().toISOString(),
      });

      // ============================================
      // PHASE 1: RESEARCH
      // ============================================
      let research: ResearchServiceOutput | undefined;

      if (enableResearch) {
        const researchStart = Date.now();

        onProgress?.({
          type: 'agent:progress',
          data: {
            phase: 'research',
            status: 'started',
          },
          timestamp: new Date().toISOString(),
        });

        research = await this.researchService.conductResearch(
          {
            topic,
            depth: researchDepth,
            includeNews: false,
          },
          context,
          onProgress
        );

        phaseTimes.research = Date.now() - researchStart;

        onProgress?.({
          type: 'agent:progress',
          data: {
            phase: 'research',
            status: 'completed',
            sourceCount: research.sources.length,
            findingCount: research.keyFindings.length,
            duration: phaseTimes.research,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // ============================================
      // PHASE 2: TOPIC GENERATION
      // ============================================
      const topicGenStart = Date.now();

      onProgress?.({
        type: 'agent:progress',
        data: {
          phase: 'topic_generation',
          status: 'started',
        },
        timestamp: new Date().toISOString(),
      });

      const topics = await this.generateTopicsWithResearch(
        topic,
        slideCount,
        research
      );

      phaseTimes.topicGeneration = Date.now() - topicGenStart;

      onProgress?.({
        type: 'agent:progress',
        data: {
          phase: 'topic_generation',
          status: 'completed',
          topicCount: topics.length,
          duration: phaseTimes.topicGeneration,
        },
        timestamp: new Date().toISOString(),
      });

      // ============================================
      // PHASE 3: CONTENT GENERATION
      // ============================================
      const contentGenStart = Date.now();

      onProgress?.({
        type: 'agent:progress',
        data: {
          phase: 'content_generation',
          status: 'started',
        },
        timestamp: new Date().toISOString(),
      });

      const slides = await this.generateContentWithResearch(
        topics,
        research,
        context,
        onProgress
      );

      phaseTimes.contentGeneration = Date.now() - contentGenStart;

      onProgress?.({
        type: 'agent:progress',
        data: {
          phase: 'content_generation',
          status: 'completed',
          slideCount: slides.length,
          duration: phaseTimes.contentGeneration,
        },
        timestamp: new Date().toISOString(),
      });

      // ============================================
      // PHASE 4: PRE-PRODUCTION
      // ============================================
      const preProductionStart = Date.now();

      onProgress?.({
        type: 'agent:progress',
        data: {
          phase: 'pre_production',
          status: 'started',
        },
        timestamp: new Date().toISOString(),
      });

      const qualityScore = await this.preProduction(slides, research);

      phaseTimes.preProduction = Date.now() - preProductionStart;

      onProgress?.({
        type: 'agent:progress',
        data: {
          phase: 'pre_production',
          status: 'completed',
          qualityScore,
          duration: phaseTimes.preProduction,
        },
        timestamp: new Date().toISOString(),
      });

      // ============================================
      // FINAL OUTPUT
      // ============================================
      const totalTime = Date.now() - startTime;

      onProgress?.({
        type: 'agent:progress',
        data: {
          phase: 'pipeline:completed',
          totalTime,
          phaseTimes,
        },
        timestamp: new Date().toISOString(),
      });

      return {
        presentationId: context.presentationId || `pres-${Date.now()}`,
        topics,
        slides,
        research,
        metadata: {
          totalTime,
          phaseTimes,
          qualityScore,
        },
      };
    } catch (error) {
      onProgress?.({
        type: 'agent:error',
        data: {
          agent: 'PresentationPipelineService',
          error: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * PHASE 2: Generate topics with research context
   */
  private async generateTopicsWithResearch(
    topic: string,
    slideCount: number,
    research?: ResearchServiceOutput
  ): Promise<TopicWithResearch[]> {
    const prompt = research
      ? `Du bist ein Präsentations-Experte. Erstelle genau ${slideCount} Folienthemen für eine Präsentation über: "${topic}"

RESEARCH SUMMARY:
${research.summary}

KEY FINDINGS:
${research.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

SOURCES:
${research.sources.map((s, i) => `${i + 1}. ${s.title} (${s.url})`).join('\n')}

Erstelle ${slideCount} Folienthemen basierend auf den Research-Ergebnissen.

Ausgabe NUR ein JSON-Array mit diesem exakten Format:
[
  {
    "order": 1,
    "title": "Einleitung",
    "description": "Kurze Übersicht über das Thema",
    "keyPoints": ["Punkt aus Research 1", "Punkt aus Research 2"],
    "relevantSources": ["URL1", "URL2"]
  },
  ...
]

Regeln:
- Genau ${slideCount} Themen
- Erstes Thema muss "Einleitung" oder "Introduction" sein
- Letztes Thema muss "Fazit", "Zusammenfassung" oder "Conclusion" sein
- Jedes Thema sollte 2-4 keyPoints aus den Research-Findings haben
- relevantSources sollten URLs aus den Research-Quellen sein
- Themen müssen logisch und gut strukturiert sein
- Ausgabe NUR das JSON-Array, kein anderer Text
- Alle Titel und Beschreibungen auf Deutsch`
      : `Du bist ein Präsentations-Experte. Erstelle genau ${slideCount} Folienthemen für eine Präsentation über: "${topic}"

Ausgabe NUR ein JSON-Array mit diesem exakten Format:
[
  {
    "order": 1,
    "title": "Einleitung",
    "description": "Kurze Übersicht über das Thema",
    "keyPoints": ["Hauptpunkt 1", "Hauptpunkt 2"]
  },
  ...
]

Regeln:
- Genau ${slideCount} Themen
- Erstes Thema muss "Einleitung" sein
- Letztes Thema muss "Fazit" oder "Zusammenfassung" sein
- Ausgabe NUR das JSON-Array, kein anderer Text
- Alle Titel und Beschreibungen auf Deutsch`;

    try {
      const topics = await this.llmTool.generateJSON<TopicWithResearch[]>(prompt);

      // Validate topics
      if (!Array.isArray(topics) || topics.length !== slideCount) {
        throw new Error(
          `Expected ${slideCount} topics, got ${Array.isArray(topics) ? topics.length : 0}`
        );
      }

      return topics;
    } catch (error) {
      console.error('Error generating topics:', error);
      throw new Error(
        `Failed to generate topics: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * PHASE 3: Generate content with research context
   */
  private async generateContentWithResearch(
    topics: TopicWithResearch[],
    research: ResearchServiceOutput | undefined,
    context: AgentServiceContext,
    onProgress?: ProgressCallback
  ): Promise<SlideContent[]> {
    const slides: SlideContent[] = [];

    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];

      // Build context for this slide
      const slideContext = this.buildSlideContext(topic, research);

      // Generate slide content
      const prompt = `Erstelle den Inhalt für Folie ${topic.order}: "${topic.title}"

BESCHREIBUNG:
${topic.description}

KEY POINTS:
${topic.keyPoints.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}

${slideContext ? `RESEARCH CONTEXT:\n${slideContext}\n` : ''}

Erstelle einen informativen und ansprechenden Folieninhalt mit:
- Klarem Titel
- Strukturiertem Inhalt (Absätze oder Stichpunkte)
- Speaker Notes (optional)

Format: Markdown
Sprache: Deutsch`;

      try {
        const content = await this.llmTool.generate(prompt);

        slides.push({
          title: topic.title,
          content: content,
          bulletPoints: topic.keyPoints,
          notes: slideContext,
        });

        // Emit progress
        onProgress?.({
          type: 'agent:progress',
          data: {
            phase: 'content_generation',
            slideNumber: i + 1,
            totalSlides: topics.length,
            progress: ((i + 1) / topics.length) * 100,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Error generating slide ${i + 1}:`, error);
        // Continue with next slide
        slides.push({
          title: topic.title,
          content: `Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`,
          bulletPoints: topic.keyPoints,
        });
      }
    }

    return slides;
  }

  /**
   * Build context for a specific slide from research
   */
  private buildSlideContext(
    topic: TopicWithResearch,
    research?: ResearchServiceOutput
  ): string | undefined {
    if (!research) return undefined;

    // Find relevant findings for this topic
    const relevantFindings = research.keyFindings.filter((finding) => {
      const topicKeywords = [
        ...topic.title.toLowerCase().split(' '),
        ...topic.description.toLowerCase().split(' '),
      ];
      return topicKeywords.some((keyword) =>
        finding.toLowerCase().includes(keyword)
      );
    });

    // Find relevant sources
    const relevantSources = topic.relevantSources
      ? research.sources.filter((s) => topic.relevantSources?.includes(s.url))
      : [];

    if (relevantFindings.length === 0 && relevantSources.length === 0) {
      return undefined;
    }

    let context = '';

    if (relevantFindings.length > 0) {
      context += 'Relevante Erkenntnisse:\n';
      context += relevantFindings.map((f) => `- ${f}`).join('\n');
      context += '\n\n';
    }

    if (relevantSources.length > 0) {
      context += 'Quellen:\n';
      context += relevantSources
        .map((s) => `- ${s.title} (${s.url})`)
        .join('\n');
    }

    return context.trim();
  }

  /**
   * PHASE 4: Pre-production quality checks
   */
  private async preProduction(
    slides: SlideContent[],
    research?: ResearchServiceOutput
  ): Promise<number> {
    // Quality checks
    let qualityScore = 100;

    // Check 1: All slides have content
    const emptySlides = slides.filter((s) => !s.content || s.content.trim().length < 10);
    if (emptySlides.length > 0) {
      qualityScore -= emptySlides.length * 10;
    }

    // Check 2: Slides have reasonable length
    const tooShortSlides = slides.filter(
      (s) => s.content && s.content.split(/\s+/).length < 20
    );
    if (tooShortSlides.length > 0) {
      qualityScore -= tooShortSlides.length * 5;
    }

    // Check 3: First slide is introduction
    if (
      slides[0] &&
      !slides[0].title.toLowerCase().includes('einleitung') &&
      !slides[0].title.toLowerCase().includes('introduction')
    ) {
      qualityScore -= 5;
    }

    // Check 4: Last slide is conclusion
    const lastSlide = slides[slides.length - 1];
    if (
      lastSlide &&
      !lastSlide.title.toLowerCase().includes('fazit') &&
      !lastSlide.title.toLowerCase().includes('zusammenfassung') &&
      !lastSlide.title.toLowerCase().includes('conclusion')
    ) {
      qualityScore -= 5;
    }

    // Check 5: Research was used (if available)
    if (research && slides.some((s) => s.notes)) {
      qualityScore += 10; // Bonus for using research
    }

    return Math.max(0, Math.min(100, qualityScore));
  }

  /**
   * Quick presentation generation (without research)
   */
  async quickGenerate(
    topic: string,
    slideCount: number,
    context: AgentServiceContext,
    onProgress?: ProgressCallback
  ): Promise<PresentationPipelineOutput> {
    return this.execute(
      {
        topic,
        slideCount,
        enableResearch: false,
      },
      context,
      onProgress
    );
  }
}

