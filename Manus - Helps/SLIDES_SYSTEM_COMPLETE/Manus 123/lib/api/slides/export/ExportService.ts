/**
 * Export Service for Slides
 * 
 * Handles exporting presentations to PDF and PPTX formats.
 * 
 * Features:
 * - PDF Export (using html2canvas + jsPDF)
 * - PPTX Export (using pptxgenjs)
 * - Aspect Ratio Preservation
 * - Theme Support
 * - Layout Support
 * 
 * @author Payperwork Team
 * @date 2025-10-20
 */

import { Slide, PresentationFormat, PresentationTheme } from '@/types/slides';

// ============================================
// Types
// ============================================

export interface ExportOptions {
  filename?: string;
  quality?: number; // 0-1 for PDF
  includeNotes?: boolean;
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  blob?: Blob;
}

// ============================================
// Aspect Ratio Mappings
// ============================================

const ASPECT_RATIOS: Record<PresentationFormat, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1024, height: 768 },
  'A4': { width: 2100, height: 2970 }, // 210mm x 297mm at 10px/mm
};

// ============================================
// Export Service Class
// ============================================

export class ExportService {
  /**
   * Export slides to PDF
   */
  static async exportToPDF(
    slides: Slide[],
    format: PresentationFormat,
    theme: PresentationTheme,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      // Dynamic import to avoid SSR issues
      const { default: jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const { width, height } = ASPECT_RATIOS[format];
      const aspectRatio = width / height;

      // Create PDF with correct dimensions
      const pdf = new jsPDF({
        orientation: aspectRatio > 1 ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height],
      });

      // Render each slide
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];

        // Create temporary DOM element for slide
        const slideElement = await this.renderSlideToDOM(slide, format, theme);

        // Convert to canvas
        const canvas = await html2canvas(slideElement, {
          width,
          height,
          scale: options.quality || 2,
          backgroundColor: '#ffffff',
        });

        // Add to PDF
        if (i > 0) {
          pdf.addPage();
        }

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);

        // Add speaker notes if requested
        if (options.includeNotes && slide.speaker_notes) {
          pdf.addPage();
          pdf.setFontSize(12);
          pdf.text(`Notes for Slide ${i + 1}:`, 20, 40);
          pdf.setFontSize(10);
          const lines = pdf.splitTextToSize(slide.speaker_notes, width - 40);
          pdf.text(lines, 20, 60);
        }

        // Cleanup
        slideElement.remove();
      }

      // Generate blob
      const blob = pdf.output('blob');
      const filename = options.filename || `presentation-${Date.now()}.pdf`;

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      return {
        success: true,
        filename,
        blob,
      };
    } catch (error) {
      console.error('PDF export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF export failed',
      };
    }
  }

  /**
   * Export slides to PPTX
   */
  static async exportToPPTX(
    slides: Slide[],
    format: PresentationFormat,
    theme: PresentationTheme,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      // Dynamic import
      const pptxgen = (await import('pptxgenjs')).default;

      const pres = new pptxgen();

      // Set presentation size based on format
      const { width, height } = ASPECT_RATIOS[format];
      pres.layout = 'LAYOUT_WIDE'; // Default
      pres.defineLayout({
        name: 'CUSTOM',
        width: width / 96, // Convert px to inches (96 DPI)
        height: height / 96,
      });
      pres.layout = 'CUSTOM';

      // Get theme colors
      const colors = this.getThemeColors(theme);

      // Add each slide
      for (const slide of slides) {
        const pptSlide = pres.addSlide();

        // Set background
        pptSlide.background = { color: colors.bg };

        // Render based on layout
        switch (slide.layout) {
          case 'title_slide':
            this.addTitleSlide(pptSlide, slide, colors);
            break;
          case 'content':
            this.addContentSlide(pptSlide, slide, colors);
            break;
          case 'two_column':
            this.addTwoColumnSlide(pptSlide, slide, colors);
            break;
          case 'quote':
            this.addQuoteSlide(pptSlide, slide, colors);
            break;
          case 'image':
            this.addImageSlide(pptSlide, slide, colors);
            break;
          default:
            this.addContentSlide(pptSlide, slide, colors);
        }

        // Add speaker notes
        if (options.includeNotes && slide.speaker_notes) {
          pptSlide.addNotes(slide.speaker_notes);
        }
      }

      // Generate and download
      const filename = options.filename || `presentation-${Date.now()}.pptx`;
      await pres.writeFile({ fileName: filename });

      return {
        success: true,
        filename,
      };
    } catch (error) {
      console.error('PPTX export failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PPTX export failed',
      };
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Render slide to DOM element (for PDF export)
   */
  private static async renderSlideToDOM(
    slide: Slide,
    format: PresentationFormat,
    theme: PresentationTheme
  ): Promise<HTMLElement> {
    const { width, height } = ASPECT_RATIOS[format];
    const colors = this.getThemeColors(theme);

    const element = document.createElement('div');
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.backgroundColor = colors.bg;
    element.style.padding = '48px';
    element.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    // Add title
    const title = document.createElement('h1');
    title.textContent = slide.title;
    title.style.fontSize = '48px';
    title.style.fontWeight = 'bold';
    title.style.color = colors.primary;
    title.style.marginBottom = '32px';
    element.appendChild(title);

    // Add content
    const content = document.createElement('div');
    content.innerHTML = this.markdownToHTML(slide.content);
    content.style.fontSize = '24px';
    content.style.lineHeight = '1.6';
    content.style.color = colors.text;
    element.appendChild(content);

    // Append to body (temporarily)
    document.body.appendChild(element);

    return element;
  }

  /**
   * Get theme colors
   */
  private static getThemeColors(theme: PresentationTheme) {
    const themes: Record<PresentationTheme, { primary: string; bg: string; text: string }> = {
      default: { primary: '#64748b', bg: '#f8fafc', text: '#1e293b' },
      red: { primary: '#ef4444', bg: '#fef2f2', text: '#7f1d1d' },
      rose: { primary: '#f43f5e', bg: '#fff1f2', text: '#881337' },
      orange: { primary: '#f97316', bg: '#fff7ed', text: '#7c2d12' },
      green: { primary: '#22c55e', bg: '#f0fdf4', text: '#14532d' },
      blue: { primary: '#3b82f6', bg: '#eff6ff', text: '#1e3a8a' },
      yellow: { primary: '#eab308', bg: '#fefce8', text: '#713f12' },
      violet: { primary: '#8b5cf6', bg: '#faf5ff', text: '#4c1d95' },
    };
    return themes[theme] || themes.default;
  }

  /**
   * Convert markdown to HTML (simple)
   */
  private static markdownToHTML(markdown: string): string {
    return markdown
      .split('\n')
      .map((line) => {
        if (line.startsWith('- ')) {
          return `<li>${line.substring(2)}</li>`;
        }
        return `<p>${line}</p>`;
      })
      .join('');
  }

  /**
   * Add title slide to PPTX
   */
  private static addTitleSlide(slide: any, data: Slide, colors: any) {
    slide.addText(data.title, {
      x: '10%',
      y: '40%',
      w: '80%',
      h: '20%',
      fontSize: 48,
      bold: true,
      color: colors.primary,
      align: 'center',
      valign: 'middle',
    });

    if (data.content) {
      slide.addText(data.content, {
        x: '10%',
        y: '65%',
        w: '80%',
        h: '15%',
        fontSize: 24,
        color: colors.text,
        align: 'center',
      });
    }
  }

  /**
   * Add content slide to PPTX
   */
  private static addContentSlide(slide: any, data: Slide, colors: any) {
    slide.addText(data.title, {
      x: '5%',
      y: '5%',
      w: '90%',
      h: '10%',
      fontSize: 36,
      bold: true,
      color: colors.primary,
    });

    slide.addText(data.content, {
      x: '5%',
      y: '20%',
      w: '90%',
      h: '70%',
      fontSize: 20,
      color: colors.text,
      bullet: true,
    });
  }

  /**
   * Add two column slide to PPTX
   */
  private static addTwoColumnSlide(slide: any, data: Slide, colors: any) {
    const parts = data.content.split('---');

    slide.addText(data.title, {
      x: '5%',
      y: '5%',
      w: '90%',
      h: '10%',
      fontSize: 36,
      bold: true,
      color: colors.primary,
    });

    slide.addText(parts[0] || '', {
      x: '5%',
      y: '20%',
      w: '42%',
      h: '70%',
      fontSize: 18,
      color: colors.text,
    });

    slide.addText(parts[1] || parts[0] || '', {
      x: '53%',
      y: '20%',
      w: '42%',
      h: '70%',
      fontSize: 18,
      color: colors.text,
    });
  }

  /**
   * Add quote slide to PPTX
   */
  private static addQuoteSlide(slide: any, data: Slide, colors: any) {
    slide.addText(`"${data.content}"`, {
      x: '10%',
      y: '35%',
      w: '80%',
      h: '30%',
      fontSize: 32,
      italic: true,
      color: colors.primary,
      align: 'center',
      valign: 'middle',
    });

    if (data.title) {
      slide.addText(`— ${data.title}`, {
        x: '10%',
        y: '70%',
        w: '80%',
        h: '10%',
        fontSize: 20,
        color: colors.text,
        align: 'center',
      });
    }
  }

  /**
   * Add image slide to PPTX
   */
  private static addImageSlide(slide: any, data: Slide, colors: any) {
    slide.addText(data.title, {
      x: '5%',
      y: '5%',
      w: '90%',
      h: '10%',
      fontSize: 36,
      bold: true,
      color: colors.primary,
    });

    if (data.background_image) {
      slide.addImage({
        path: data.background_image,
        x: '5%',
        y: '20%',
        w: '90%',
        h: '70%',
      });
    } else {
      slide.addText('[Image Placeholder]', {
        x: '5%',
        y: '45%',
        w: '90%',
        h: '10%',
        fontSize: 24,
        color: colors.text,
        align: 'center',
      });
    }
  }
}

