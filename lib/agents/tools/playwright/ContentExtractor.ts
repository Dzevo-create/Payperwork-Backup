/**
 * Content Extractor
 *
 * Extracts and converts page content to various formats.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { Page } from 'playwright';
import TurndownService from 'turndown';

export class ContentExtractor {
  private turndownService: TurndownService;

  constructor() {
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
  }

  /**
   * Extract content from page
   */
  async extractContent(
    page: Page,
    selector: string | undefined,
    format: 'html' | 'text' | 'markdown'
  ): Promise<string> {
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

    return content;
  }

  /**
   * Clean content (remove extra whitespace, etc.)
   */
  private cleanContent(content: string): string {
    return content
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
