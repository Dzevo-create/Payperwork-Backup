/**
 * Playwright Browser Tool
 *
 * Advanced web browser automation using Playwright.
 * Extends BrowserTool with JavaScript rendering, screenshots, PDF generation,
 * and interactive browser automation.
 *
 * Features:
 * - Full JavaScript rendering
 * - Screenshots (full page, element-specific, viewport)
 * - PDF generation
 * - Wait for selectors/network/events
 * - Interactive actions (click, type, scroll)
 * - Cookie and localStorage management
 * - Network request interception
 * - Multi-browser support (chromium, firefox, webkit)
 *
 * @author Payperwork Team
 * @date 2025-10-19
 * @phase Phase 4: Playwright Integration
 */

import { BaseTool, ToolResult } from '../base';
import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import TurndownService from 'turndown';
import { PageMetadata } from './BrowserTool';

// ============================================
// Playwright Browser Tool Input/Output Types
// ============================================

export interface PlaywrightBrowserToolInput {
  /** URL to navigate to */
  url: string;

  /** Output format (default: markdown) */
  format?: 'html' | 'text' | 'markdown' | 'screenshot' | 'pdf';

  /** Browser to use (default: chromium) */
  browser?: 'chromium' | 'firefox' | 'webkit';

  /** Extract metadata (default: true) */
  extractMetadata?: boolean;

  /** Selector to extract specific content (optional) */
  selector?: string;

  /** Wait for selector before extracting (optional) */
  waitForSelector?: string;

  /** Wait for network idle before extracting (default: false) */
  waitForNetworkIdle?: boolean;

  /** Custom wait time in ms (optional) */
  waitTime?: number;

  /** Screenshot options (if format=screenshot) */
  screenshot?: {
    fullPage?: boolean;
    selector?: string;
    path?: string; // Save to file path
    type?: 'png' | 'jpeg';
    quality?: number; // 0-100 for jpeg
  };

  /** PDF options (if format=pdf) */
  pdf?: {
    path?: string; // Save to file path
    format?: 'A4' | 'Letter' | 'Legal';
    landscape?: boolean;
    printBackground?: boolean;
  };

  /** Viewport size (default: 1920x1080) */
  viewport?: {
    width: number;
    height: number;
  };

  /** User agent (optional) */
  userAgent?: string;

  /** Timeout in ms (default: 30000) */
  timeout?: number;

  /** Execute custom JavaScript (optional) */
  executeScript?: string;

  /** Interactive actions before extraction (optional) */
  actions?: Array<{
    type: 'click' | 'type' | 'scroll' | 'wait';
    selector?: string;
    text?: string;
    delay?: number;
  }>;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface PlaywrightBrowserToolOutput {
  /** Page URL (may differ from input if redirected) */
  url: string;

  /** Page content (format depends on input.format) */
  content?: string;

  /** Screenshot buffer (if format=screenshot) */
  screenshot?: Buffer;

  /** PDF buffer (if format=pdf) */
  pdf?: Buffer;

  /** Page metadata */
  metadata?: PageMetadata;

  /** HTTP status code */
  statusCode?: number;

  /** Raw HTML (only if format=html) */
  rawHtml?: string;

  /** Script execution result (if executeScript was provided) */
  scriptResult?: any;
}

// ============================================
// Playwright Browser Tool Class
// ============================================

export class PlaywrightBrowserTool extends BaseTool<
  PlaywrightBrowserToolInput,
  PlaywrightBrowserToolOutput
> {
  private turndownService: TurndownService;
  private browserInstances: Map<string, Browser> = new Map();

  constructor() {
    super({
      name: 'playwright_browser',
      description: 'Advanced web browser automation with Playwright',
      version: '2.0.0',
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

    this.log('info', 'Playwright Browser Tool initialized');
  }

  /**
   * Execute browser automation
   */
  async execute(
    input: PlaywrightBrowserToolInput
  ): Promise<ToolResult<PlaywrightBrowserToolOutput>> {
    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      // Validate input
      this.validateInput(input, {
        required: ['url'],
      });

      const {
        url,
        format = 'markdown',
        browser: browserType = 'chromium',
        extractMetadata = true,
        selector,
        waitForSelector,
        waitForNetworkIdle = false,
        waitTime,
        screenshot: screenshotOptions,
        pdf: pdfOptions,
        viewport = { width: 1920, height: 1080 },
        userAgent,
        timeout = 30000,
        executeScript,
        actions,
      } = input;

      this.log('debug', `Launching browser`, {
        url,
        browserType,
        format,
      });

      // Launch browser
      browser = await this.launchBrowser(browserType);

      // Create context
      context = await browser.newContext({
        viewport,
        userAgent,
      });

      // Create page
      page = await context.newPage();

      // Set default timeout
      page.setDefaultTimeout(timeout);

      this.log('debug', `Navigating to URL`, { url });

      // Navigate to URL
      const response = await page.goto(url, {
        waitUntil: waitForNetworkIdle ? 'networkidle' : 'domcontentloaded',
      });

      const statusCode = response?.status();
      const finalUrl = page.url();

      // Wait for selector if specified
      if (waitForSelector) {
        this.log('debug', `Waiting for selector: ${waitForSelector}`);
        await page.waitForSelector(waitForSelector, { timeout });
      }

      // Wait for custom time if specified
      if (waitTime) {
        this.log('debug', `Waiting for ${waitTime}ms`);
        await page.waitForTimeout(waitTime);
      }

      // Execute interactive actions
      if (actions && actions.length > 0) {
        await this.executeActions(page, actions);
      }

      // Execute custom script
      let scriptResult: any;
      if (executeScript) {
        this.log('debug', `Executing custom script`);
        scriptResult = await page.evaluate(executeScript);
      }

      // Extract metadata
      let metadata: PageMetadata | undefined;
      if (extractMetadata) {
        metadata = await this.extractMetadata(page);
      }

      // Process based on format
      let content: string | undefined;
      let screenshotBuffer: Buffer | undefined;
      let pdfBuffer: Buffer | undefined;
      let rawHtml: string | undefined;

      switch (format) {
        case 'screenshot':
          screenshotBuffer = await this.takeScreenshot(page, screenshotOptions);
          break;

        case 'pdf':
          pdfBuffer = await this.generatePDF(page, pdfOptions);
          break;

        case 'html':
        case 'text':
        case 'markdown':
        default:
          const extractResult = await this.extractContent(page, selector, format);
          content = extractResult.content;
          if (format === 'html') {
            rawHtml = content;
          }
          break;
      }

      this.log('debug', `Content extracted`, {
        url: finalUrl,
        format,
      });

      // Close browser
      await browser.close();
      browser = null;

      return this.createSuccessResult({
        url: finalUrl,
        content,
        screenshot: screenshotBuffer,
        pdf: pdfBuffer,
        metadata,
        statusCode,
        rawHtml,
        scriptResult,
      });
    } catch (error) {
      this.log('error', `Browser automation failed`, {
        error: error instanceof Error ? error.message : String(error),
      });

      // Clean up
      if (browser) {
        await browser.close().catch(() => {});
      }

      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown browser error'
      );
    }
  }

  /**
   * Launch browser (with caching)
   */
  private async launchBrowser(type: 'chromium' | 'firefox' | 'webkit'): Promise<Browser> {
    // For simplicity, always launch a new browser
    // In production, you might want to reuse browser instances
    switch (type) {
      case 'chromium':
        return await chromium.launch({ headless: true });
      case 'firefox':
        return await firefox.launch({ headless: true });
      case 'webkit':
        return await webkit.launch({ headless: true });
      default:
        return await chromium.launch({ headless: true });
    }
  }

  /**
   * Execute interactive actions
   */
  private async executeActions(
    page: Page,
    actions: Array<{
      type: 'click' | 'type' | 'scroll' | 'wait';
      selector?: string;
      text?: string;
      delay?: number;
    }>
  ): Promise<void> {
    for (const action of actions) {
      this.log('debug', `Executing action: ${action.type}`, action);

      switch (action.type) {
        case 'click':
          if (action.selector) {
            await page.click(action.selector);
          }
          break;

        case 'type':
          if (action.selector && action.text) {
            await page.fill(action.selector, action.text);
          }
          break;

        case 'scroll':
          if (action.selector) {
            await page.locator(action.selector).scrollIntoViewIfNeeded();
          } else {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          }
          break;

        case 'wait':
          if (action.delay) {
            await page.waitForTimeout(action.delay);
          }
          break;
      }
    }
  }

  /**
   * Extract content from page
   */
  private async extractContent(
    page: Page,
    selector: string | undefined,
    format: 'html' | 'text' | 'markdown'
  ): Promise<{ content: string }> {
    let html: string;

    if (selector) {
      // Extract content from specific element
      const element = await page.locator(selector).first();
      html = await element.innerHTML();
    } else {
      // Extract entire body
      html = await page.content();
    }

    let content: string;

    switch (format) {
      case 'html':
        content = html;
        break;

      case 'text':
        if (selector) {
          content = await page.locator(selector).first().innerText();
        } else {
          content = await page.locator('body').innerText();
        }
        break;

      case 'markdown':
      default:
        content = this.turndownService.turndown(html);
        break;
    }

    // Clean content
    content = this.cleanContent(content);

    return { content };
  }

  /**
   * Take screenshot
   */
  private async takeScreenshot(
    page: Page,
    options?: PlaywrightBrowserToolInput['screenshot']
  ): Promise<Buffer> {
    const {
      fullPage = true,
      selector,
      path,
      type = 'png',
      quality,
    } = options || {};

    if (selector) {
      // Screenshot specific element
      const element = await page.locator(selector).first();
      return await element.screenshot({
        path,
        type,
        ...(type === 'jpeg' && quality ? { quality } : {}),
      });
    } else {
      // Screenshot full page or viewport
      return await page.screenshot({
        fullPage,
        path,
        type,
        ...(type === 'jpeg' && quality ? { quality } : {}),
      });
    }
  }

  /**
   * Generate PDF
   */
  private async generatePDF(
    page: Page,
    options?: PlaywrightBrowserToolInput['pdf']
  ): Promise<Buffer> {
    const {
      path,
      format = 'A4',
      landscape = false,
      printBackground = true,
    } = options || {};

    return await page.pdf({
      path,
      format,
      landscape,
      printBackground,
    });
  }

  /**
   * Extract metadata from page
   */
  private async extractMetadata(page: Page): Promise<PageMetadata> {
    const metadata = await page.evaluate(() => {
      const getMetaContent = (name: string): string | undefined => {
        const meta = document.querySelector(
          `meta[name="${name}"], meta[property="${name}"]`
        );
        return meta?.getAttribute('content') || undefined;
      };

      const canonical = document.querySelector('link[rel="canonical"]');
      const keywordsContent = getMetaContent('keywords');

      return {
        title: document.title || undefined,
        description: getMetaContent('description'),
        ogTitle: getMetaContent('og:title'),
        ogDescription: getMetaContent('og:description'),
        ogImage: getMetaContent('og:image'),
        canonical: canonical?.getAttribute('href') || undefined,
        author: getMetaContent('author'),
        publishedDate: getMetaContent('article:published_time'),
        keywords: keywordsContent
          ? keywordsContent.split(',').map((k) => k.trim())
          : undefined,
      };
    });

    return metadata;
  }

  /**
   * Clean content (remove extra whitespace, etc.)
   */
  private cleanContent(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Helper: Fetch page as markdown with JS rendering
   */
  async fetchMarkdown(url: string, waitForNetworkIdle = true): Promise<string> {
    const result = await this.execute({
      url,
      format: 'markdown',
      waitForNetworkIdle,
    });

    if (!result.success || !result.data?.content) {
      throw new Error(`Failed to fetch page: ${result.error}`);
    }

    return result.data.content;
  }

  /**
   * Helper: Take screenshot
   */
  async takePageScreenshot(
    url: string,
    options?: {
      fullPage?: boolean;
      selector?: string;
      waitForSelector?: string;
    }
  ): Promise<Buffer> {
    const result = await this.execute({
      url,
      format: 'screenshot',
      screenshot: {
        fullPage: options?.fullPage,
        selector: options?.selector,
      },
      waitForSelector: options?.waitForSelector,
    });

    if (!result.success || !result.data?.screenshot) {
      throw new Error(`Failed to take screenshot: ${result.error}`);
    }

    return result.data.screenshot;
  }

  /**
   * Helper: Generate PDF
   */
  async generatePagePDF(
    url: string,
    options?: {
      format?: 'A4' | 'Letter' | 'Legal';
      landscape?: boolean;
    }
  ): Promise<Buffer> {
    const result = await this.execute({
      url,
      format: 'pdf',
      pdf: options,
    });

    if (!result.success || !result.data?.pdf) {
      throw new Error(`Failed to generate PDF: ${result.error}`);
    }

    return result.data.pdf;
  }

  /**
   * Helper: Execute custom script
   */
  async executePageScript(url: string, script: string): Promise<any> {
    const result = await this.execute({
      url,
      executeScript: script,
    });

    if (!result.success) {
      throw new Error(`Failed to execute script: ${result.error}`);
    }

    return result.data?.scriptResult;
  }

  /**
   * Helper: Interactive page automation
   */
  async automatePageActions(
    url: string,
    actions: PlaywrightBrowserToolInput['actions']
  ): Promise<string> {
    const result = await this.execute({
      url,
      format: 'markdown',
      actions,
      waitForNetworkIdle: true,
    });

    if (!result.success || !result.data?.content) {
      throw new Error(`Failed to automate actions: ${result.error}`);
    }

    return result.data.content;
  }

  /**
   * Clean up all browser instances
   */
  async cleanup(): Promise<void> {
    for (const [type, browser] of this.browserInstances) {
      try {
        await browser.close();
        this.log('debug', `Closed ${type} browser`);
      } catch (error) {
        this.log('warn', `Failed to close ${type} browser`, { error });
      }
    }
    this.browserInstances.clear();
  }
}
