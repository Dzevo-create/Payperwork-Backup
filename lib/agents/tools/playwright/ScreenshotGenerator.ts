/**
 * Screenshot Generator
 *
 * Generates screenshots from web pages.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { Page } from 'playwright';
import { ScreenshotOptions } from './types';

export class ScreenshotGenerator {
  /**
   * Take screenshot
   */
  async takeScreenshot(
    page: Page,
    options?: ScreenshotOptions
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
}
