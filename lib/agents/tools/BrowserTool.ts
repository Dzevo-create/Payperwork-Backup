/**
 * Browser Tool
 *
 * Fetches and extracts content from web pages.
 * Simplified version using fetch (can be upgraded to Playwright later).
 *
 * Features:
 * - Fetch web page content
 * - Extract text content
 * - Extract metadata (title, description, og tags)
 * - Convert HTML to markdown
 * - Screenshot support (planned for Playwright version)
 *
 * Future: Full Playwright integration for:
 * - JavaScript rendering
 * - Screenshots
 * - PDF generation
 * - Form filling
 * - Browser automation
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 2: Core Tools
 */

import { BaseTool, ToolResult } from '../base';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';

// ============================================
// Browser Tool Input/Output Types
// ============================================

export interface PageMetadata {
  /** Page title */
  title?: string;

  /** Meta description */
  description?: string;

  /** Open Graph title */
  ogTitle?: string;

  /** Open Graph description */
  ogDescription?: string;

  /** Open Graph image */
  ogImage?: string;

  /** Canonical URL */
  canonical?: string;

  /** Author */
  author?: string;

  /** Published date */
  publishedDate?: string;

  /** Keywords */
  keywords?: string[];
}

export interface BrowserToolInput {
  /** URL to fetch */
  url: string;

  /** Output format (default: markdown) */
  format?: 'html' | 'text' | 'markdown';

  /** Extract metadata (default: true) */
  extractMetadata?: boolean;

  /** Selector to extract specific content (optional) */
  selector?: string;

  /** User agent (default: modern browser) */
  userAgent?: string;

  /** Timeout in ms (default: 30000) */
  timeout?: number;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface BrowserToolOutput {
  /** Page URL */
  url: string;

  /** Page content (format depends on input.format) */
  content: string;

  /** Page metadata */
  metadata?: PageMetadata;

  /** HTTP status code */
  statusCode: number;

  /** Content type */
  contentType?: string;

  /** Raw HTML (only if format=html) */
  rawHtml?: string;
}

// ============================================
// Browser Tool Class
// ============================================

export class BrowserTool extends BaseTool<BrowserToolInput, BrowserToolOutput> {
  private turndownService: TurndownService;

  constructor() {
    super({
      name: 'browser',
      description: 'Fetch and extract content from web pages',
      version: '1.0.0',
    });

    // Initialize turndown for HTML to Markdown conversion
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    // Configure turndown rules
    this.turndownService.addRule('removeScripts', {
      filter: ['script', 'style', 'noscript'],
      replacement: () => '',
    });

    this.log('info', 'Browser Tool initialized');
  }

  /**
   * Execute browser fetch
   */
  async execute(input: BrowserToolInput): Promise<ToolResult<BrowserToolOutput>> {
    try {
      // Validate input
      this.validateInput(input, {
        required: ['url'],
      });

      const {
        url,
        format = 'markdown',
        extractMetadata = true,
        selector,
        userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        timeout = 30000,
      } = input;

      this.log('debug', `Fetching page`, {
        url,
        format,
      });

      // Fetch page
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const contentType = response.headers.get('content-type') || undefined;

      this.log('debug', `Page fetched`, {
        url,
        statusCode: response.status,
        htmlLength: html.length,
      });

      // Parse HTML
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Extract metadata if requested
      let metadata: PageMetadata | undefined;
      if (extractMetadata) {
        metadata = this.extractMetadata(document);
      }

      // Extract content based on selector or entire body
      let contentElement = document.body;
      if (selector) {
        const selected = document.querySelector(selector);
        if (selected) {
          contentElement = selected as HTMLElement;
        } else {
          this.log('warn', `Selector not found: ${selector}`);
        }
      }

      // Convert to requested format
      let content: string;
      let rawHtml: string | undefined;

      switch (format) {
        case 'html':
          content = contentElement.innerHTML;
          rawHtml = content;
          break;

        case 'text':
          content = contentElement.textContent || '';
          break;

        case 'markdown':
        default:
          content = this.turndownService.turndown(contentElement.innerHTML);
          break;
      }

      // Clean up content
      content = this.cleanContent(content);

      this.log('debug', `Content extracted`, {
        url,
        format,
        contentLength: content.length,
      });

      return this.createSuccessResult({
        url,
        content,
        metadata,
        statusCode: response.status,
        contentType,
        rawHtml,
      });
    } catch (error) {
      this.log('error', `Failed to fetch page`, {
        error: error instanceof Error ? error.message : String(error),
      });

      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown browser error'
      );
    }
  }

  /**
   * Extract metadata from document
   */
  private extractMetadata(document: Document): PageMetadata {
    const getMetaContent = (name: string): string | undefined => {
      const meta = document.querySelector(
        `meta[name="${name}"], meta[property="${name}"]`
      );
      return meta?.getAttribute('content') || undefined;
    };

    const metadata: PageMetadata = {
      title: document.title || undefined,
      description: getMetaContent('description'),
      ogTitle: getMetaContent('og:title'),
      ogDescription: getMetaContent('og:description'),
      ogImage: getMetaContent('og:image'),
      author: getMetaContent('author'),
      publishedDate: getMetaContent('article:published_time'),
    };

    // Extract canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      metadata.canonical = canonical.getAttribute('href') || undefined;
    }

    // Extract keywords
    const keywordsContent = getMetaContent('keywords');
    if (keywordsContent) {
      metadata.keywords = keywordsContent.split(',').map((k) => k.trim());
    }

    return metadata;
  }

  /**
   * Clean content (remove extra whitespace, etc.)
   */
  private cleanContent(content: string): string {
    return (
      content
        // Remove multiple blank lines
        .replace(/\n{3,}/g, '\n\n')
        // Remove leading/trailing whitespace
        .trim()
    );
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Helper: Fetch page as markdown
   */
  async fetchMarkdown(url: string): Promise<string> {
    const result = await this.execute({
      url,
      format: 'markdown',
    });

    if (!result.success || !result.data) {
      throw new Error(`Failed to fetch page: ${result.error}`);
    }

    return result.data.content;
  }

  /**
   * Helper: Fetch page as text
   */
  async fetchText(url: string): Promise<string> {
    const result = await this.execute({
      url,
      format: 'text',
    });

    if (!result.success || !result.data) {
      throw new Error(`Failed to fetch page: ${result.error}`);
    }

    return result.data.content;
  }

  /**
   * Helper: Fetch page metadata only
   */
  async fetchMetadata(url: string): Promise<PageMetadata> {
    const result = await this.execute({
      url,
      extractMetadata: true,
    });

    if (!result.success || !result.data || !result.data.metadata) {
      throw new Error(`Failed to fetch metadata: ${result.error}`);
    }

    return result.data.metadata;
  }

  /**
   * Helper: Extract specific content by selector
   */
  async extractBySelector(url: string, selector: string): Promise<string> {
    const result = await this.execute({
      url,
      selector,
      format: 'markdown',
    });

    if (!result.success || !result.data) {
      throw new Error(`Failed to extract content: ${result.error}`);
    }

    return result.data.content;
  }

  /**
   * Helper: Check if URL is accessible
   */
  async isAccessible(url: string): Promise<boolean> {
    const result = await this.execute({
      url,
      format: 'text',
    });

    return result.success;
  }

  /**
   * Helper: Get page title
   */
  async getPageTitle(url: string): Promise<string | null> {
    const result = await this.execute({
      url,
      extractMetadata: true,
    });

    if (!result.success || !result.data) {
      return null;
    }

    return result.data.metadata?.title || null;
  }
}
