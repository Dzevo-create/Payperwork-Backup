/**
 * Browser Tool - Screenshot Tests
 *
 * Tests for screenshot generation functionality.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { test, expect } from '@playwright/test';
import { PlaywrightBrowserTool } from '../../../lib/agents/tools/PlaywrightBrowserTool';

const TEST_URL = 'https://example.com';

test.describe('BrowserTool - Screenshots', () => {
  let tool: PlaywrightBrowserTool;

  test.beforeEach(() => {
    tool = new PlaywrightBrowserTool();
  });

  test.afterEach(async () => {
    await tool.cleanup();
  });

  test('should take full page screenshot', async () => {
    const result = await tool.execute({
      url: TEST_URL,
      format: 'screenshot',
      screenshot: { fullPage: true, type: 'png' },
    });

    expect(result.success).toBe(true);
    expect(result.data?.screenshot).toBeInstanceOf(Buffer);
    expect(result.data?.screenshot!.length).toBeGreaterThan(0);
  });

  test('should take viewport screenshot', async () => {
    const result = await tool.execute({
      url: TEST_URL,
      format: 'screenshot',
      screenshot: { fullPage: false },
    });

    expect(result.success).toBe(true);
    expect(result.data?.screenshot).toBeInstanceOf(Buffer);
  });

  test('should take JPEG screenshot with quality', async () => {
    const result = await tool.execute({
      url: TEST_URL,
      format: 'screenshot',
      screenshot: { type: 'jpeg', quality: 80 },
    });

    expect(result.success).toBe(true);
    expect(result.data?.screenshot).toBeInstanceOf(Buffer);
  });
});
