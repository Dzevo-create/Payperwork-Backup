/**
 * PDF Generator
 *
 * Generates PDF documents from web pages.
 *
 * @author Payperwork Team
 * @date 2025-10-19
 */

import { Page } from 'playwright';
import { PDFOptions } from './types';

export class PDFGenerator {
  /**
   * Generate PDF
   */
  async generatePDF(
    page: Page,
    options?: PDFOptions
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
}
