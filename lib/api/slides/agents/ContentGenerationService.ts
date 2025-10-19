/**
 * Content Generation Service
 *
 * Service layer for integrating ContentWriterAgent into Slides workflow.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { ContentWriterAgent } from '@/lib/agents/agents/ContentWriterAgent';
import type { AgentExecutionContext } from '@/lib/agents/base';
import type {
  AgentServiceContext,
  ContentGenerationInput,
  ContentGenerationOutput,
  SlideContent,
  ProgressCallback,
} from './types';

export class ContentGenerationService {
  private agent: ContentWriterAgent;

  constructor() {
    this.agent = new ContentWriterAgent();
  }

  /**
   * Generate slide content
   */
  async generateSlideContent(
    input: ContentGenerationInput,
    context: AgentServiceContext,
    onProgress?: ProgressCallback
  ): Promise<ContentGenerationOutput> {
    const {
      topic,
      slideCount = 10,
      audience,
      tone = 'professional',
      enableResearch = false,
    } = input;

    // Emit progress: content generation started
    onProgress?.({
      type: 'content:started',
      data: { topic, slideCount },
      timestamp: new Date().toISOString(),
    });

    // Convert to agent context
    const agentContext: AgentExecutionContext = {
      userId: context.userId,
      sessionId: context.sessionId,
      presentationId: context.presentationId,
    };

    try {
      const slides: SlideContent[] = [];

      // Generate content for each slide
      for (let i = 0; i < slideCount; i++) {
        const slidePrompt =
          i === 0
            ? `Title slide for: ${topic}`
            : `Slide ${i + 1} about: ${topic}`;

        const result = await this.agent.execute(
          {
            topic: slidePrompt,
            contentType: 'slide',
            audience,
            tone,
            enableResearch: enableResearch && i === 1, // Only research for slide 2
          },
          agentContext
        );

        if (!result.success || !result.data) {
          throw new Error(`Failed to generate slide ${i + 1}: ${result.error}`);
        }

        // Parse slide content
        const slideContent = this.parseSlideContent(result.data.content, i);
        slides.push(slideContent);

        // Emit progress
        onProgress?.({
          type: 'agent:progress',
          data: {
            slideNumber: i + 1,
            totalSlides: slideCount,
            progress: ((i + 1) / slideCount) * 100,
          },
          timestamp: new Date().toISOString(),
        });
      }

      // Calculate total word count
      const totalWordCount = slides.reduce(
        (sum, slide) => sum + (slide.content?.split(/\s+/).length || 0),
        0
      );

      // Emit progress: content completed
      onProgress?.({
        type: 'content:completed',
        data: { slideCount: slides.length, wordCount: totalWordCount },
        timestamp: new Date().toISOString(),
      });

      return {
        slides,
        metadata: {
          totalSlides: slides.length,
          wordCount: totalWordCount,
        },
      };
    } catch (error) {
      // Emit error
      onProgress?.({
        type: 'agent:error',
        data: {
          agent: 'ContentWriterAgent',
          error: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * Parse slide content from generated text
   */
  private parseSlideContent(content: string, index: number): SlideContent {
    const lines = content.split('\n').filter((line) => line.trim());

    // Extract title (first line or first heading)
    const title =
      lines.find((line) => line.startsWith('#')) ?.replace(/^#+\s*/, '') ||
      lines[0] ||
      `Slide ${index + 1}`;

    // Extract bullet points
    const bulletPoints = lines
      .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map((line) => line.replace(/^[-*]\s*/, '').trim());

    // Extract content (non-bullet, non-title lines)
    const contentLines = lines.filter(
      (line) =>
        !line.startsWith('#') &&
        !line.trim().startsWith('-') &&
        !line.trim().startsWith('*')
    );

    return {
      title: title.trim(),
      content: contentLines.join('\n').trim() || content,
      bulletPoints: bulletPoints.length > 0 ? bulletPoints : undefined,
    };
  }
}
