/**
 * Browser Tool - Basic Tests
 *
 * Tests for basic page fetching functionality.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { test, expect } from '@playwright/test';
import { PlaywrightBrowserTool } from '../../../lib/agents/tools/PlaywrightBrowserTool';

const TEST_URL = 'https://example.com';

test.describe('BrowserTool - Basic Page Fetching', () => {
  let tool: PlaywrightBrowserTool;

  test.beforeEach(() => {
    tool = new PlaywrightBrowserTool();
  });

  test.afterEach(async () => {
    await tool.cleanup();
  });

  test('should fetch page as markdown', async () => {
    const result = await tool.execute({
      url: TEST_URL,
      format: 'markdown',
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.content).toContain('Example Domain');
  });

  test('should fetch page as text', async () => {
    const result = await tool.execute({
      url: TEST_URL,
      format: 'text',
    });

    expect(result.success).toBe(true);
    expect(result.data?.content).toBeDefined();
    expect(typeof result.data?.content).toBe('string');
  });

  test('should fetch page as HTML', async () => {
    const result = await tool.execute({
      url: TEST_URL,
      format: 'html',
    });

    expect(result.success).toBe(true);
    expect(result.data?.rawHtml).toBeDefined();
    expect(result.data?.rawHtml).toContain('<');
  });

  test('should handle different browsers', async () => {
    const chromiumResult = await tool.execute({
      url: TEST_URL,
      browser: 'chromium',
    });
    expect(chromiumResult.success).toBe(true);

    const firefoxResult = await tool.execute({
      url: TEST_URL,
      browser: 'firefox',
    });
    expect(firefoxResult.success).toBe(true);
  });
});
