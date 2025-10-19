/**
 * Page Actions
 *
 * Executes interactive actions on web pages.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { Page } from 'playwright';
import { PageAction } from './types';

export class PageActions {
  /**
   * Execute page actions
   */
  async executeActions(page: Page, actions: PageAction[]): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'click':
          await page.click(action.selector);
          break;

        case 'type':
          await page.fill(action.selector, action.text);
          break;

        case 'scroll':
          if (action.selector) {
            await page.locator(action.selector).scrollIntoViewIfNeeded();
          } else {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          }
          break;

        case 'wait':
          await page.waitForTimeout(action.delay);
          break;
      }
    }
  }

  /**
   * Wait for selector
   */
  async waitForSelector(
    page: Page,
    selector: string,
    timeout?: number
  ): Promise<void> {
    await page.waitForSelector(selector, { timeout });
  }

  /**
   * Wait for custom time
   */
  async waitForTime(page: Page, ms: number): Promise<void> {
    await page.waitForTimeout(ms);
  }
}
