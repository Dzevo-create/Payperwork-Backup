/**
 * Playwright Browser Tool - Type Definitions
 *
 * Shared types for Playwright browser automation.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { PageMetadata } from '../BrowserTool';

// ============================================
// Screenshot Types
// ============================================

export interface ScreenshotOptions {
  /** Take full page screenshot (default: true) */
  fullPage?: boolean;

  /** Screenshot specific element by selector */
  selector?: string;

  /** Save to file path */
  path?: string;

  /** Image type (default: png) */
  type?: 'png' | 'jpeg';

  /** JPEG quality 0-100 (only for jpeg) */
  quality?: number;
}

// ============================================
// PDF Types
// ============================================

export interface PDFOptions {
  /** Save to file path */
  path?: string;

  /** Page format (default: A4) */
  format?: 'A4' | 'Letter' | 'Legal';

  /** Landscape orientation (default: false) */
  landscape?: boolean;

  /** Print background graphics (default: true) */
  printBackground?: boolean;
}

// ============================================
// Viewport Types
// ============================================

export interface ViewportSize {
  width: number;
  height: number;
}

// ============================================
// Action Types
// ============================================

export type PageAction =
  | ClickAction
  | TypeAction
  | ScrollAction
  | WaitAction;

export interface ClickAction {
  type: 'click';
  selector: string;
}

export interface TypeAction {
  type: 'type';
  selector: string;
  text: string;
}

export interface ScrollAction {
  type: 'scroll';
  selector?: string; // If provided, scroll to element; otherwise scroll to bottom
}

export interface WaitAction {
  type: 'wait';
  delay: number;
}

// ============================================
// Input/Output Types
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
  screenshot?: ScreenshotOptions;

  /** PDF options (if format=pdf) */
  pdf?: PDFOptions;

  /** Viewport size (default: 1920x1080) */
  viewport?: ViewportSize;

  /** User agent (optional) */
  userAgent?: string;

  /** Timeout in ms (default: 30000) */
  timeout?: number;

  /** Execute custom JavaScript (optional) */
  executeScript?: string;

  /** Interactive actions before extraction (optional) */
  actions?: PageAction[];

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
// Browser Context Types
// ============================================

export interface BrowserLaunchOptions {
  headless?: boolean;
  viewport?: ViewportSize;
  userAgent?: string;
}

export type BrowserType = 'chromium' | 'firefox' | 'webkit';
