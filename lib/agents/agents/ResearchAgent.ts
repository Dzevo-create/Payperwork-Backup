/**
 * Research Agent
 *
 * Specialized agent for conducting deep research on topics.
 * Gathers, analyzes, and synthesizes information from multiple sources.
 *
 * Capabilities:
 * - Multi-source research
 * - Information extraction and synthesis
 * - Fact verification
 * - Source credibility assessment
 * - Research report generation
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
// Research Agent Input/Output Types
// ============================================

export interface ResearchAgentInput {
  /** Research topic/question */
  topic: string;

  /** Research depth (default: medium) */
  depth?: 'quick' | 'medium' | 'deep';

  /** Number of sources to analyze (default: based on depth) */
  sourceCount?: number;

  /** Specific aspects to focus on */
  focusAreas?: string[];

  /** Include news sources (default: false) */
  includeNews?: boolean;
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
  relevanceScore?: number;
  domain?: string;
}

export interface ResearchAgentOutput {
  /** Research topic */
  topic: string;

  /** Executive summary */
  summary: string;

  /** Key findings */
  keyFindings: string[];

  /** Sources analyzed */
  sources: ResearchSource[];

  /** Detailed analysis (optional) */
  detailedAnalysis?: string;

  /** Research metadata */
  metadata: {
    researchDepth: string;
    sourcesAnalyzed: number;
    executionTime: number;
  };
}

// ============================================
// Research Agent Class
// ============================================

export class ResearchAgent extends BaseAgent<
  ResearchAgentInput,
  ResearchAgentOutput
> {
  private llmTool: LLMTool;
  private searchTool: SearchTool;
  private browserTool: BrowserTool;

  constructor() {
    super({
      name: 'ResearchAgent',
      description: 'Conducts deep research and analysis on topics',
      version: '1.0.0',
      metadata: {
        capabilities: [
          'multi_source_research',
          'information_synthesis',
          'fact_verification',
        ],
      },
    });

    this.llmTool = new LLMTool();
    this.searchTool = new SearchTool();
    this.browserTool = new BrowserTool();

    this.registerTool(this.llmTool);
    this.registerTool(this.searchTool);
    this.registerTool(this.browserTool);

    this.log('info', 'Research Agent initialized');
  }

  async execute(
    input: ResearchAgentInput,
    context: AgentExecutionContext
  ): Promise<AgentResult<ResearchAgentOutput>> {
    const startTime = Date.now();

    try {
      const { topic, depth = 'medium', sourceCount, includeNews = false } = input;

      this.log('info', 'Starting research', { topic, depth });
      this.emitProgress('research:started', { topic });

      // Determine source count based on depth
      const targetSourceCount =
        sourceCount || this.getSourceCountForDepth(depth);

      // Step 1: Gather sources
      this.emitProgress('research:gathering_sources', { topic });
      const sources = await this.gatherSources(
        topic,
        targetSourceCount,
        includeNews
      );

      // Step 2: Analyze sources and extract key findings
      this.emitProgress('research:analyzing', { sourceCount: sources.length });
      const { keyFindings, summary, detailedAnalysis } =
        await this.analyzeSources(topic, sources, depth);

      const executionTime = Date.now() - startTime;

      this.log('info', 'Research completed', {
        topic,
        sourceCount: sources.length,
        executionTime,
      });

      this.emitProgress('research:completed', {
        sourceCount: sources.length,
        findingCount: keyFindings.length,
      });

      return this.createSuccessResult(
        {
          topic,
          summary,
          keyFindings,
          sources,
          detailedAnalysis,
          metadata: {
            researchDepth: depth,
            sourcesAnalyzed: sources.length,
            executionTime,
          },
        },
        {
          executionTime,
          sourcesAnalyzed: sources.length,
        }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.log('error', 'Research failed', { error: errorMessage });
      this.emitProgress('research:error', { error: errorMessage });

      return {
        success: false,
        error: errorMessage,
        metadata: { executionTime: Date.now() - startTime },
      };
    }
  }

  /**
   * Gather sources from web search
   */
  private async gatherSources(
    topic: string,
    count: number,
    includeNews: boolean
  ): Promise<ResearchSource[]> {
    const sources: ResearchSource[] = [];

    // Web search
    const webResults = await this.searchTool.search(topic, count);
    sources.push(
      ...webResults.map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        domain: r.domain,
      }))
    );

    // News search (if enabled)
    if (includeNews) {
      const newsResults = await this.searchTool.searchNews(topic, 3);
      sources.push(
        ...newsResults.map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
          domain: r.domain,
        }))
      );
    }

    this.log('debug', 'Sources gathered', { count: sources.length });

    return sources;
  }

  /**
   * Analyze sources and extract insights
   */
  private async analyzeSources(
    topic: string,
    sources: ResearchSource[],
    depth: string
  ): Promise<{
    keyFindings: string[];
    summary: string;
    detailedAnalysis?: string;
  }> {
    // Build context from sources
    const sourcesContext = sources
      .map(
        (s, i) =>
          `Source ${i + 1}: ${s.title}\nURL: ${s.url}\nContent: ${s.snippet}\n`
      )
      .join('\n---\n\n');

    // Analyze with LLM
    const analysisPrompt = `You are a research analyst. Analyze the following sources about "${topic}" and provide:

1. A concise executive summary (2-3 sentences)
2. Key findings (5-7 main points)
${depth === 'deep' ? '3. Detailed analysis of trends and patterns' : ''}

Sources:
${sourcesContext}

Respond in JSON format:
{
  "summary": "...",
  "keyFindings": ["finding 1", "finding 2", ...],
  ${depth === 'deep' ? '"detailedAnalysis": "..."' : ''}
}`;

    const analysis = await this.llmTool.generateJSON<{
      summary: string;
      keyFindings: string[];
      detailedAnalysis?: string;
    }>(analysisPrompt);

    return analysis;
  }

  /**
   * Get recommended source count for depth level
   */
  private getSourceCountForDepth(depth: string): number {
    switch (depth) {
      case 'quick':
        return 3;
      case 'medium':
        return 7;
      case 'deep':
        return 12;
      default:
        return 7;
    }
  }

  /**
   * Helper: Quick research
   */
  async quickResearch(
    topic: string,
    context: AgentExecutionContext
  ): Promise<ResearchAgentOutput> {
    const result = await this.execute(
      { topic, depth: 'quick' },
      context
    );

    if (!result.success || !result.data) {
      throw new Error(`Research failed: ${result.error}`);
    }

    return result.data;
  }
}
