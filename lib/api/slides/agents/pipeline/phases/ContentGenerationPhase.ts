/**
 * Content Generation Phase
 *
 * Phase 3: Generate detailed slide content
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { LLMTool } from '@/lib/agents/tools/LLMTool';
import { ContextBuilder } from '../utils/contextBuilder';
import { ProgressEmitter } from '../utils/progressEmitter';
import type {
  ContentGenerationPhaseResult,
  TopicWithResearch,
  SlideContent,
  ResearchServiceOutput,
  ProgressCallback,
} from '../types';

export class ContentGenerationPhase {
  private llmTool: LLMTool;
  private progressEmitter: ProgressEmitter;

  constructor(onProgress?: ProgressCallback, private userId?: string) {
    this.llmTool = new LLMTool();
    this.progressEmitter = new ProgressEmitter(onProgress);
    // Agent events can be added here in future
  }

  /**
   * Execute content generation phase
   */
  async execute(
    topics: TopicWithResearch[],
    research?: ResearchServiceOutput
  ): Promise<ContentGenerationPhaseResult> {
    const startTime = Date.now();

    try {
      this.progressEmitter.phaseStarted('content_generation', {
        totalSlides: topics.length,
      });

      const slides: SlideContent[] = [];

      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];

        try {
          const slide = await this.generateSlideContent(topic, research);
          slides.push(slide);

          // Emit progress
          this.progressEmitter.phaseProgress('content_generation', {
            slideNumber: i + 1,
            totalSlides: topics.length,
            progress: ((i + 1) / topics.length) * 100,
          });
        } catch (error) {
          console.error(`Error generating slide ${i + 1}:`, error);

          // Add error slide but continue
          slides.push({
            title: topic.title,
            content: `Error generating content: ${error instanceof Error ? error.message : 'Unknown error'}`,
            bulletPoints: topic.keyPoints,
          });
        }
      }

      const duration = Date.now() - startTime;

      this.progressEmitter.phaseCompleted('content_generation', {
        slideCount: slides.length,
        duration,
      });

      return {
        slides,
        duration,
      };
    } catch (error) {
      this.progressEmitter.phaseFailed(
        'content_generation',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Generate content for a single slide
   */
  private async generateSlideContent(
    topic: TopicWithResearch,
    research?: ResearchServiceOutput
  ): Promise<SlideContent> {
    // Build research context for this slide
    const slideContext = ContextBuilder.buildSlideContext(topic, research);

    // Build prompt
    const prompt = this.buildContentPrompt(topic, slideContext);

    // Generate content
    const content = await this.llmTool.generateText(prompt);

    return {
      title: topic.title,
      content: content,
      bulletPoints: topic.keyPoints,
      notes: slideContext,
    };
  }

  /**
   * Build prompt for content generation
   */
  private buildContentPrompt(topic: TopicWithResearch, context?: string): string {
    return `Erstelle den Inhalt für Folie ${topic.order}: "${topic.title}"

BESCHREIBUNG:
${topic.description}

KEY POINTS:
${topic.keyPoints.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}

${context ? `RESEARCH CONTEXT:\n${context}\n` : ''}

Erstelle einen informativen und ansprechenden Folieninhalt mit:
- Klarem Titel
- Strukturiertem Inhalt (Absätze oder Stichpunkte)
- Speaker Notes (optional)

Format: Markdown
Sprache: Deutsch`;
  }
}
