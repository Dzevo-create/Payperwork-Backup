/**
 * Browser Manager
 *
 * Manages Playwright browser instances lifecycle.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';
import { BrowserType, BrowserLaunchOptions, ViewportSize } from './types';

export class BrowserManager {
  private browserInstances: Map<string, Browser> = new Map();

  /**
   * Launch browser
   */
  async launchBrowser(
    type: BrowserType,
    options?: BrowserLaunchOptions
  ): Promise<Browser> {
    const { headless = true } = options || {};

    switch (type) {
      case 'chromium':
        return await chromium.launch({ headless });
      case 'firefox':
        return await firefox.launch({ headless });
      case 'webkit':
        return await webkit.launch({ headless });
      default:
        return await chromium.launch({ headless });
    }
  }

  /**
   * Create browser context
   */
  async createContext(
    browser: Browser,
    viewport?: ViewportSize,
    userAgent?: string
  ): Promise<BrowserContext> {
    return await browser.newContext({
      viewport,
      userAgent,
    });
  }

  /**
   * Create new page
   */
  async createPage(
    context: BrowserContext,
    timeout?: number
  ): Promise<Page> {
    const page = await context.newPage();

    if (timeout) {
      page.setDefaultTimeout(timeout);
    }

    return page;
  }

  /**
   * Navigate to URL
   */
  async navigateToURL(
    page: Page,
    url: string,
    waitForNetworkIdle: boolean = false
  ): Promise<number | undefined> {
    const response = await page.goto(url, {
      waitUntil: waitForNetworkIdle ? 'networkidle' : 'domcontentloaded',
    });

    return response?.status();
  }

  /**
   * Close browser
   */
  async closeBrowser(browser: Browser): Promise<void> {
    await browser.close();
  }

  /**
   * Store browser instance
   */
  storeBrowserInstance(type: string, browser: Browser): void {
    this.browserInstances.set(type, browser);
  }

  /**
   * Get stored browser instance
   */
  getBrowserInstance(type: string): Browser | undefined {
    return this.browserInstances.get(type);
  }

  /**
   * Cleanup all browser instances
   */
  async cleanup(): Promise<void> {
    for (const [type, browser] of this.browserInstances) {
      try {
        await browser.close();
      } catch (error) {
        console.warn(`Failed to close ${type} browser:`, error);
      }
    }
    this.browserInstances.clear();
  }
}
