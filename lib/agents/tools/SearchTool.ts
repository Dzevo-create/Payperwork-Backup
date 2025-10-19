/**
 * Search Tool
 *
 * Performs web searches using Brave Search API.
 * Used by agents to find information, research topics, and gather data.
 *
 * Features:
 * - Web search with pagination
 * - News search
 * - Image search (optional)
 * - Search result filtering
 * - Snippet extraction
 * - Result ranking
 *
 * Setup:
 * 1. Get API key from https://brave.com/search/api/
 * 2. Add BRAVE_SEARCH_API_KEY to .env
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 2: Core Tools
 */

import { BaseTool, ToolResult } from '../base';

// ============================================
// Search Tool Input/Output Types
// ============================================

export interface SearchResult {
  /** Result title */
  title: string;

  /** Result URL */
  url: string;

  /** Result snippet/description */
  snippet: string;

  /** Page rank (1 = first result) */
  rank: number;

  /** Published date (if available) */
  publishedDate?: string;

  /** Source domain */
  domain?: string;
}

export interface SearchToolInput {
  /** Search query */
  query: string;

  /** Search type (default: web) */
  type?: 'web' | 'news';

  /** Number of results to return (default: 10, max: 20) */
  count?: number;

  /** Page offset for pagination (default: 0) */
  offset?: number;

  /** Country code for localized results (default: US) */
  country?: string;

  /** Language code (default: en) */
  language?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface SearchToolOutput {
  /** Search query used */
  query: string;

  /** Search results */
  results: SearchResult[];

  /** Total results found (estimated) */
  totalResults?: number;

  /** Query used */
  queryUsed: string;

  /** Raw API response (for debugging) */
  rawResponse?: any;
}

// ============================================
// Brave Search API Types
// ============================================

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  page_age?: string;
  family_friendly?: boolean;
}

interface BraveNewsResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  breaking?: boolean;
  source?: {
    name: string;
    url: string;
  };
}

interface BraveSearchResponse {
  web?: {
    results: BraveWebResult[];
  };
  news?: {
    results: BraveNewsResult[];
  };
  query?: {
    original: string;
    altered?: string;
  };
}

// ============================================
// Search Tool Class
// ============================================

export class SearchTool extends BaseTool<SearchToolInput, SearchToolOutput> {
  private apiKey: string;
  private baseUrl = 'https://api.search.brave.com/res/v1';

  constructor() {
    super({
      name: 'search',
      description: 'Search the web using Brave Search API',
      version: '1.0.0',
    });

    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) {
      this.log(
        'warn',
        'BRAVE_SEARCH_API_KEY not set - SearchTool will use fallback mode'
      );
      this.apiKey = '';
    } else {
      this.apiKey = apiKey;
      this.log('info', 'Search Tool initialized with Brave API');
    }
  }

  /**
   * Execute search
   */
  async execute(input: SearchToolInput): Promise<ToolResult<SearchToolOutput>> {
    try {
      // Validate input
      this.validateInput(input, {
        required: ['query'],
      });

      const {
        query,
        type = 'web',
        count = 10,
        offset = 0,
        country = 'US',
        language = 'en',
      } = input;

      // Check if API key is available
      if (!this.apiKey) {
        return this.createErrorResult(
          'BRAVE_SEARCH_API_KEY environment variable is required. Get an API key from https://brave.com/search/api/'
        );
      }

      this.log('debug', `Performing ${type} search`, {
        query,
        count,
        offset,
      });

      // Build search URL
      const searchUrl = new URL(`${this.baseUrl}/web/search`);
      searchUrl.searchParams.set('q', query);
      searchUrl.searchParams.set('count', Math.min(count, 20).toString());
      searchUrl.searchParams.set('offset', offset.toString());
      searchUrl.searchParams.set('country', country);
      searchUrl.searchParams.set('search_lang', language);
      searchUrl.searchParams.set('text_decorations', 'false');
      searchUrl.searchParams.set('safesearch', 'moderate');

      // Add result_filter based on type
      if (type === 'news') {
        searchUrl.searchParams.set('result_filter', 'news');
      }

      // Make request
      const response = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Brave Search API error (${response.status}): ${errorText}`
        );
      }

      const data: BraveSearchResponse = await response.json();

      // Parse results based on type
      const results =
        type === 'news'
          ? this.parseNewsResults(data.news?.results || [])
          : this.parseWebResults(data.web?.results || []);

      this.log('debug', `Search completed`, {
        query,
        resultCount: results.length,
      });

      return this.createSuccessResult({
        query,
        results,
        totalResults: results.length,
        queryUsed: data.query?.altered || data.query?.original || query,
        rawResponse: data,
      });
    } catch (error) {
      this.log('error', `Search failed`, {
        error: error instanceof Error ? error.message : String(error),
      });

      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown search error'
      );
    }
  }

  /**
   * Parse web results from Brave API
   */
  private parseWebResults(results: BraveWebResult[]): SearchResult[] {
    return results.map((result, index) => ({
      title: result.title,
      url: result.url,
      snippet: result.description,
      rank: index + 1,
      publishedDate: result.age || result.page_age,
      domain: this.extractDomain(result.url),
    }));
  }

  /**
   * Parse news results from Brave API
   */
  private parseNewsResults(results: BraveNewsResult[]): SearchResult[] {
    return results.map((result, index) => ({
      title: result.title,
      url: result.url,
      snippet: result.description,
      rank: index + 1,
      publishedDate: result.age,
      domain: result.source?.name || this.extractDomain(result.url),
    }));
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Helper: Simple web search
   */
  async search(query: string, count = 10): Promise<SearchResult[]> {
    const result = await this.execute({
      query,
      type: 'web',
      count,
    });

    if (!result.success || !result.data) {
      throw new Error(`Search failed: ${result.error}`);
    }

    return result.data.results;
  }

  /**
   * Helper: News search
   */
  async searchNews(query: string, count = 10): Promise<SearchResult[]> {
    const result = await this.execute({
      query,
      type: 'news',
      count,
    });

    if (!result.success || !result.data) {
      throw new Error(`News search failed: ${result.error}`);
    }

    return result.data.results;
  }

  /**
   * Helper: Get top result
   */
  async getTopResult(query: string): Promise<SearchResult | null> {
    const results = await this.search(query, 1);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Helper: Search and filter by domain
   */
  async searchDomain(
    query: string,
    domain: string,
    count = 10
  ): Promise<SearchResult[]> {
    const siteQuery = `site:${domain} ${query}`;
    return this.search(siteQuery, count);
  }

  /**
   * Helper: Extract snippets (summaries) from results
   */
  getSnippets(results: SearchResult[]): string[] {
    return results.map((r) => r.snippet);
  }

  /**
   * Helper: Get all result URLs
   */
  getUrls(results: SearchResult[]): string[] {
    return results.map((r) => r.url);
  }

  /**
   * Helper: Format results as markdown
   */
  formatAsMarkdown(results: SearchResult[]): string {
    return results
      .map((r, i) => {
        return `## ${i + 1}. ${r.title}\n\n**URL:** ${r.url}\n\n${r.snippet}\n${
          r.domain ? `\n**Source:** ${r.domain}` : ''
        }${r.publishedDate ? `\n**Published:** ${r.publishedDate}` : ''}\n`;
      })
      .join('\n---\n\n');
  }

  /**
   * Helper: Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
