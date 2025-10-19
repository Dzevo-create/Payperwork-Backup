/**
 * Playwright Browser Tool Tests
 *
 * Comprehensive tests for PlaywrightBrowserTool functionality.
 *
 * Test Coverage:
 * - Basic page fetching (markdown, text, html)
 * - Metadata extraction
 * - Screenshot generation
 * - PDF generation
 * - JavaScript execution
 * - Interactive actions
 * - Selector-based extraction
 * - Error handling
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { test, expect } from '@playwright/test';
import { PlaywrightBrowserTool } from '../../lib/agents/tools/PlaywrightBrowserTool';
import * as fs from 'fs';
import * as path from 'path';

// Test URLs
const TEST_URL_SIMPLE = 'https://example.com';
const TEST_URL_WIKIPEDIA = 'https://en.wikipedia.org/wiki/Artificial_intelligence';

test.describe('PlaywrightBrowserTool', () => {
  let tool: PlaywrightBrowserTool;

  test.beforeEach(() => {
    tool = new PlaywrightBrowserTool();
  });

  test.afterEach(async () => {
    await tool.cleanup();
  });

  // ============================================
  // Basic Functionality Tests
  // ============================================

  test.describe('Basic Page Fetching', () => {
    test('should fetch page as markdown', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        format: 'markdown',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.content).toBeDefined();
      expect(result.data?.content).toContain('Example Domain');
      expect(result.data?.url).toBe(TEST_URL_SIMPLE);
      expect(result.data?.statusCode).toBe(200);
    });

    test('should fetch page as text', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        format: 'text',
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
      expect(typeof result.data?.content).toBe('string');
      expect(result.data?.content).toContain('Example Domain');
    });

    test('should fetch page as HTML', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        format: 'html',
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
      expect(result.data?.rawHtml).toBeDefined();
      expect(result.data?.rawHtml).toContain('<');
      expect(result.data?.rawHtml).toContain('>');
    });

    test('should handle different browsers', async () => {
      // Test Chromium
      const chromiumResult = await tool.execute({
        url: TEST_URL_SIMPLE,
        browser: 'chromium',
      });
      expect(chromiumResult.success).toBe(true);

      // Test Firefox
      const firefoxResult = await tool.execute({
        url: TEST_URL_SIMPLE,
        browser: 'firefox',
      });
      expect(firefoxResult.success).toBe(true);

      // Test WebKit
      const webkitResult = await tool.execute({
        url: TEST_URL_SIMPLE,
        browser: 'webkit',
      });
      expect(webkitResult.success).toBe(true);
    });
  });

  // ============================================
  // Metadata Extraction Tests
  // ============================================

  test.describe('Metadata Extraction', () => {
    test('should extract page metadata', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        extractMetadata: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.metadata).toBeDefined();
      expect(result.data?.metadata?.title).toBeDefined();
      expect(result.data?.metadata?.title).toContain('Example');
    });

    test('should extract OpenGraph metadata from Wikipedia', async () => {
      const result = await tool.execute({
        url: TEST_URL_WIKIPEDIA,
        extractMetadata: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.metadata).toBeDefined();
      expect(result.data?.metadata?.title).toBeDefined();
      expect(result.data?.metadata?.ogTitle).toBeDefined();
    });

    test('should handle pages without metadata gracefully', async () => {
      const result = await tool.execute({
        url: 'data:text/html,<html><body>No metadata</body></html>',
        extractMetadata: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.metadata).toBeDefined();
    });
  });

  // ============================================
  // Screenshot Tests
  // ============================================

  test.describe('Screenshot Generation', () => {
    test('should take full page screenshot', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        format: 'screenshot',
        screenshot: {
          fullPage: true,
          type: 'png',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.screenshot).toBeDefined();
      expect(result.data?.screenshot).toBeInstanceOf(Buffer);
      expect(result.data?.screenshot!.length).toBeGreaterThan(0);
    });

    test('should take viewport screenshot', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        format: 'screenshot',
        screenshot: {
          fullPage: false,
          type: 'png',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.screenshot).toBeInstanceOf(Buffer);
    });

    test('should take JPEG screenshot with quality', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        format: 'screenshot',
        screenshot: {
          type: 'jpeg',
          quality: 80,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.screenshot).toBeInstanceOf(Buffer);
    });

    test('should save screenshot to file', async () => {
      const tempPath = path.join(__dirname, '../../tmp/test-screenshot.png');

      // Ensure tmp directory exists
      const tmpDir = path.dirname(tempPath);
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        format: 'screenshot',
        screenshot: {
          path: tempPath,
        },
      });

      expect(result.success).toBe(true);
      expect(fs.existsSync(tempPath)).toBe(true);

      // Cleanup
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    });
  });

  // ============================================
  // PDF Generation Tests
  // ============================================

  test.describe('PDF Generation', () => {
    test('should generate PDF', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        format: 'pdf',
        pdf: {
          format: 'A4',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.pdf).toBeDefined();
      expect(result.data?.pdf).toBeInstanceOf(Buffer);
      expect(result.data?.pdf!.length).toBeGreaterThan(0);
    });

    test('should generate PDF with landscape orientation', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        format: 'pdf',
        pdf: {
          landscape: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.pdf).toBeInstanceOf(Buffer);
    });

    test('should save PDF to file', async () => {
      const tempPath = path.join(__dirname, '../../tmp/test.pdf');

      // Ensure tmp directory exists
      const tmpDir = path.dirname(tempPath);
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        format: 'pdf',
        pdf: {
          path: tempPath,
        },
      });

      expect(result.success).toBe(true);
      expect(fs.existsSync(tempPath)).toBe(true);

      // Cleanup
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    });
  });

  // ============================================
  // JavaScript Execution Tests
  // ============================================

  test.describe('JavaScript Execution', () => {
    test('should execute custom JavaScript', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        executeScript: 'return document.title',
      });

      expect(result.success).toBe(true);
      expect(result.data?.scriptResult).toBeDefined();
      expect(result.data?.scriptResult).toContain('Example');
    });

    test('should execute complex JavaScript', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        executeScript: `
          return {
            url: window.location.href,
            title: document.title,
            bodyLength: document.body.innerText.length
          }
        `,
      });

      expect(result.success).toBe(true);
      expect(result.data?.scriptResult).toBeDefined();
      expect(result.data?.scriptResult.url).toBe(TEST_URL_SIMPLE);
      expect(result.data?.scriptResult.title).toBeDefined();
      expect(result.data?.scriptResult.bodyLength).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Selector Tests
  // ============================================

  test.describe('Selector-based Extraction', () => {
    test('should extract content by selector', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        selector: 'h1',
        format: 'text',
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
      expect(result.data?.content).toContain('Example');
    });

    test('should wait for selector before extraction', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        waitForSelector: 'body',
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
    });

    test('should handle non-existent selector gracefully', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        selector: '.non-existent-selector',
      });

      expect(result.success).toBe(true);
      // Should still succeed but with empty or body content
    });
  });

  // ============================================
  // Wait Conditions Tests
  // ============================================

  test.describe('Wait Conditions', () => {
    test('should wait for network idle', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        waitForNetworkIdle: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
    });

    test('should wait for custom time', async () => {
      const startTime = Date.now();

      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        waitTime: 1000,
      });

      const elapsed = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsed).toBeGreaterThanOrEqual(1000);
    });
  });

  // ============================================
  // Viewport Tests
  // ============================================

  test.describe('Viewport Configuration', () => {
    test('should use custom viewport', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        viewport: {
          width: 1280,
          height: 720,
        },
      });

      expect(result.success).toBe(true);
    });

    test('should use mobile viewport', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        viewport: {
          width: 375,
          height: 667,
        },
      });

      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================

  test.describe('Error Handling', () => {
    test('should handle invalid URL', async () => {
      const result = await tool.execute({
        url: 'invalid-url',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle timeout', async () => {
      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
        timeout: 1,
        waitTime: 5000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle non-existent domain', async () => {
      const result = await tool.execute({
        url: 'https://this-domain-does-not-exist-12345.com',
        timeout: 5000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ============================================
  // Helper Methods Tests
  // ============================================

  test.describe('Helper Methods', () => {
    test('fetchMarkdown helper should work', async () => {
      const content = await tool.fetchMarkdown(TEST_URL_SIMPLE);

      expect(content).toBeDefined();
      expect(typeof content).toBe('string');
      expect(content).toContain('Example');
    });

    test('takePageScreenshot helper should work', async () => {
      const screenshot = await tool.takePageScreenshot(TEST_URL_SIMPLE, {
        fullPage: true,
      });

      expect(screenshot).toBeInstanceOf(Buffer);
      expect(screenshot.length).toBeGreaterThan(0);
    });

    test('generatePagePDF helper should work', async () => {
      const pdf = await tool.generatePagePDF(TEST_URL_SIMPLE);

      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });

    test('executePageScript helper should work', async () => {
      const result = await tool.executePageScript(
        TEST_URL_SIMPLE,
        'return document.title'
      );

      expect(result).toBeDefined();
      expect(result).toContain('Example');
    });
  });

  // ============================================
  // Performance Tests
  // ============================================

  test.describe('Performance', () => {
    test('should complete page fetch within reasonable time', async () => {
      const startTime = Date.now();

      const result = await tool.execute({
        url: TEST_URL_SIMPLE,
      });

      const elapsed = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(elapsed).toBeLessThan(10000); // Should complete within 10s
    });

    test('should handle multiple concurrent requests', async () => {
      const promises = [
        tool.execute({ url: TEST_URL_SIMPLE }),
        tool.execute({ url: TEST_URL_SIMPLE }),
        tool.execute({ url: TEST_URL_SIMPLE }),
      ];

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });
});
