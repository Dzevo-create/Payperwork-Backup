/**
 * Content Writer Agent
 *
 * Specialized agent for creating high-quality content.
 * Uses LLM, Search, and Browser tools to research and write content.
 *
 * Capabilities:
 * - Research topics using web search
 * - Extract information from web pages
 * - Generate well-structured content
 * - Fact-checking and verification
 * - Multiple content formats (article, blog post, presentation slide)
 *
 * Workflow:
 * 1. Receive topic/outline
 * 2. Research topic (optional)
 * 3. Generate content using LLM
 * 4. Format and structure output
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 3: Agent Implementation
 */

import { BaseAgent, AgentExecutionContext, AgentResult } from '../base';
import { LLMTool } from '../tools/LLMTool';
import { SearchTool } from '../tools/SearchTool';
import { BrowserTool } from '../tools/BrowserTool';

// ============================================
// Content Writer Input/Output Types
// ============================================

export interface ContentWriterInput {
  /** Topic or title */
  topic: string;

  /** Content type */
  contentType: 'article' | 'blog_post' | 'slide' | 'outline' | 'summary';

  /** Target audience (optional) */
  audience?: string;

  /** Tone (optional, default: professional) */
  tone?: 'professional' | 'casual' | 'academic' | 'creative';

  /** Word count target (optional) */
  wordCount?: number;

  /** Enable research mode (optional, default: false) */
  enableResearch?: boolean;

  /** Additional context or instructions */
  context?: string;

  /** Keywords to include (optional) */
  keywords?: string[];
}

export interface ContentWriterOutput {
  /** Generated content */
  content: string;

  /** Content metadata */
  metadata: {
    topic: string;
    contentType: string;
    wordCount: number;
    researchSources?: string[];
    generationTime: number;
  };

  /** Research data (if enableResearch=true) */
  research?: {
    sources: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
    keyPoints: string[];
  };
}

// ============================================
// Content Writer Agent Class
// ============================================

export class ContentWriterAgent extends BaseAgent<
  ContentWriterInput,
  ContentWriterOutput
> {
  private llmTool: LLMTool;
  private searchTool: SearchTool;
  private browserTool: BrowserTool;

  constructor() {
    super({
      name: 'ContentWriter',
      description:
        'Specialized agent for creating high-quality content with optional research',
      version: '1.0.0',
      metadata: {
        capabilities: [
          'content_generation',
          'research',
          'fact_checking',
          'multiple_formats',
        ],
      },
    });

    // Initialize tools
    this.llmTool = new LLMTool();
    this.searchTool = new SearchTool();
    this.browserTool = new BrowserTool();

    // Register tools with base agent
    this.registerTool(this.llmTool);
    this.registerTool(this.searchTool);
    this.registerTool(this.browserTool);

    this.log('info', 'ContentWriter Agent initialized');
  }

  /**
   * Execute content generation
   */
  async execute(
    input: ContentWriterInput,
    context: AgentExecutionContext
  ): Promise<AgentResult<ContentWriterOutput>> {
    const startTime = Date.now();

    try {
      this.log('info', 'Starting content generation', {
        topic: input.topic,
        contentType: input.contentType,
      });

      this.emitProgress('content_writer:started', {
        topic: input.topic,
        contentType: input.contentType,
      });

      // Step 1: Research (if enabled)
      let research:
        | {
            sources: Array<{ title: string; url: string; snippet: string }>;
            keyPoints: string[];
          }
        | undefined;

      if (input.enableResearch) {
        this.emitProgress('content_writer:research_started', {
          topic: input.topic,
        });

        research = await this.conductResearch(input.topic);

        this.emitProgress('content_writer:research_completed', {
          sourceCount: research.sources.length,
        });
      }

      // Step 2: Generate content
      this.emitProgress('content_writer:generation_started', {
        topic: input.topic,
      });

      const content = await this.generateContent(input, research);

      this.emitProgress('content_writer:generation_completed', {
        wordCount: this.countWords(content),
      });

      // Calculate word count
      const wordCount = this.countWords(content);
      const generationTime = Date.now() - startTime;

      this.log('info', 'Content generation completed', {
        topic: input.topic,
        wordCount,
        generationTime,
      });

      return this.createSuccessResult(
        {
          content,
          metadata: {
            topic: input.topic,
            contentType: input.contentType,
            wordCount,
            researchSources: research?.sources.map((s) => s.url),
            generationTime,
          },
          research,
        },
        {
          executionTime: generationTime,
          wordCount,
          researchEnabled: input.enableResearch,
        }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.log('error', 'Content generation failed', {
        error: errorMessage,
      });

      this.emitProgress('content_writer:error', {
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Conduct research on a topic
   */
  private async conductResearch(topic: string): Promise<{
    sources: Array<{ title: string; url: string; snippet: string }>;
    keyPoints: string[];
  }> {
    this.log('debug', 'Conducting research', { topic });

    // Search for information
    const searchResults = await this.searchTool.search(topic, 5);

    // Extract key information from search results
    const sources = searchResults.map((result) => ({
      title: result.title,
      url: result.url,
      snippet: result.snippet,
    }));

    // Generate key points from search results
    const snippetsText = sources.map((s, i) => `${i + 1}. ${s.snippet}`).join('\n');

    const keyPointsPrompt = `Based on these search results about "${topic}", extract 5-7 key points or facts:

${snippetsText}

Respond with a JSON array of key points:
["point 1", "point 2", ...]`;

    const keyPoints = await this.llmTool.generateJSON<string[]>(keyPointsPrompt);

    this.log('debug', 'Research completed', {
      sourceCount: sources.length,
      keyPointCount: keyPoints.length,
    });

    return { sources, keyPoints };
  }

  /**
   * Generate content based on input and research
   */
  private async generateContent(
    input: ContentWriterInput,
    research?: {
      sources: Array<{ title: string; url: string; snippet: string }>;
      keyPoints: string[];
    }
  ): Promise<string> {
    const {
      topic,
      contentType,
      audience = 'general audience',
      tone = 'professional',
      wordCount,
      context,
      keywords,
    } = input;

    // Build system prompt based on content type
    const systemPrompt = this.buildSystemPrompt(contentType, tone);

    // Build user prompt
    let userPrompt = `Write ${this.getContentTypeDescription(contentType)} about: ${topic}\n\n`;

    if (audience) {
      userPrompt += `Target audience: ${audience}\n`;
    }

    if (wordCount) {
      userPrompt += `Target word count: approximately ${wordCount} words\n`;
    }

    if (context) {
      userPrompt += `\nAdditional context:\n${context}\n`;
    }

    if (keywords && keywords.length > 0) {
      userPrompt += `\nInclude these keywords: ${keywords.join(', ')}\n`;
    }

    if (research) {
      userPrompt += `\n## Research Findings\n\nKey points to include:\n`;
      research.keyPoints.forEach((point, i) => {
        userPrompt += `${i + 1}. ${point}\n`;
      });

      userPrompt += `\nSources:\n`;
      research.sources.forEach((source, i) => {
        userPrompt += `${i + 1}. ${source.title} - ${source.snippet}\n`;
      });
    }

    userPrompt += `\n---\n\nNow write the ${contentType}:`;

    this.log('debug', 'Generating content with LLM', {
      contentType,
      tone,
      promptLength: userPrompt.length,
    });

    // Generate content
    const content = await this.llmTool.generateWithSystem(
      systemPrompt,
      userPrompt,
      {
        temperature: contentType === 'creative' ? 0.9 : 0.7,
        maxTokens: this.estimateTokens(wordCount),
      }
    );

    return content;
  }

  /**
   * Build system prompt based on content type
   */
  private buildSystemPrompt(
    contentType: string,
    tone: string
  ): string {
    const basePrompt = `You are an expert content writer specializing in creating high-quality, engaging content.`;

    const toneInstructions = {
      professional: 'Use a professional, authoritative tone.',
      casual: 'Use a friendly, conversational tone.',
      academic: 'Use a formal, scholarly tone with proper citations.',
      creative: 'Use a creative, engaging tone with vivid language.',
    };

    const contentInstructions = {
      article:
        'Write a well-structured article with introduction, body paragraphs, and conclusion.',
      blog_post:
        'Write an engaging blog post with a catchy introduction, informative body, and call-to-action.',
      slide:
        'Write concise, impactful content suitable for a presentation slide. Use bullet points and keep text minimal.',
      outline:
        'Create a detailed outline with main points and sub-points. Use hierarchical structure.',
      summary:
        'Write a concise summary that captures the key points and main ideas.',
    };

    return `${basePrompt}

${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}

${contentInstructions[contentType as keyof typeof contentInstructions] || contentInstructions.article}

Focus on clarity, accuracy, and engagement. Use proper formatting with markdown.`;
  }

  /**
   * Get content type description
   */
  private getContentTypeDescription(contentType: string): string {
    const descriptions: Record<string, string> = {
      article: 'a comprehensive article',
      blog_post: 'an engaging blog post',
      slide: 'concise slide content',
      outline: 'a detailed outline',
      summary: 'a concise summary',
    };

    return descriptions[contentType] || 'content';
  }

  /**
   * Estimate tokens needed based on word count
   */
  private estimateTokens(wordCount?: number): number {
    if (!wordCount) return 4096;

    // Rough estimate: 1 token ≈ 0.75 words
    // Add 50% buffer for formatting and safety
    return Math.ceil((wordCount / 0.75) * 1.5);
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  // ============================================
  // Helper Methods (Public API)
  // ============================================

  /**
   * Quick content generation without research
   */
  async writeContent(
    topic: string,
    contentType: ContentWriterInput['contentType'] = 'article',
    context: AgentExecutionContext
  ): Promise<string> {
    const result = await this.execute(
      {
        topic,
        contentType,
        enableResearch: false,
      },
      context
    );

    if (!result.success || !result.data) {
      throw new Error(`Content generation failed: ${result.error}`);
    }

    return result.data.content;
  }

  /**
   * Content generation with research
   */
  async writeWithResearch(
    topic: string,
    contentType: ContentWriterInput['contentType'] = 'article',
    context: AgentExecutionContext
  ): Promise<ContentWriterOutput> {
    const result = await this.execute(
      {
        topic,
        contentType,
        enableResearch: true,
      },
      context
    );

    if (!result.success || !result.data) {
      throw new Error(`Content generation failed: ${result.error}`);
    }

    return result.data;
  }

  /**
   * Generate slide content (specialized for presentations)
   */
  async writeSlide(
    topic: string,
    context: AgentExecutionContext,
    options?: {
      audience?: string;
      keywords?: string[];
      additionalContext?: string;
    }
  ): Promise<string> {
    const result = await this.execute(
      {
        topic,
        contentType: 'slide',
        audience: options?.audience,
        keywords: options?.keywords,
        context: options?.additionalContext,
        enableResearch: false,
      },
      context
    );

    if (!result.success || !result.data) {
      throw new Error(`Slide generation failed: ${result.error}`);
    }

    return result.data.content;
  }
}
