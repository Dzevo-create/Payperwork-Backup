/**
 * Metadata Extractor
 *
 * Extracts metadata from web pages (title, description, OpenGraph, etc.)
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { Page } from 'playwright';
import { PageMetadata } from '../BrowserTool';

export class MetadataExtractor {
  /**
   * Extract metadata from page
   */
  async extractMetadata(page: Page): Promise<PageMetadata> {
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
}
