// ============================================
// PDF Exporter
// Version: 1.0
// Date: 2025-10-19
// ============================================

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Presentation, Slide, PresentationFormat } from "@/types/slides";

/**
 * Export presentation to PDF
 *
 * @param presentation - Presentation metadata
 * @param slides - Array of slides
 * @param slideElements - Array of HTML elements (one per slide)
 * @returns Promise<void>
 */
export async function exportToPDF(
  presentation: Presentation,
  slides: Slide[],
  slideElements: HTMLElement[]
): Promise<void> {
  if (slideElements.length === 0) {
    throw new Error("No slides to export");
  }

  // Get PDF dimensions based on format
  const dimensions = getPDFDimensions(presentation.format);

  // Create PDF document
  const pdf = new jsPDF({
    orientation: dimensions.orientation,
    unit: "mm",
    format: [dimensions.width, dimensions.height],
  });

  // Convert each slide to image and add to PDF
  for (let i = 0; i < slideElements.length; i++) {
    const element = slideElements[i];
    const slide = slides[i];

    try {
      // Render element to canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: slide.background_color || "#ffffff",
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL("image/png");

      // Add new page (except for first slide)
      if (i > 0) {
        pdf.addPage();
      }

      // Add image to PDF
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        dimensions.width,
        dimensions.height,
        undefined,
        "FAST"
      );

      // Add metadata
      if (i === 0) {
        pdf.setProperties({
          title: presentation.title,
          subject: presentation.prompt,
          author: "Payperwork AI",
          creator: "Payperwork Slides",
        });
      }
    } catch (error) {
      console.error(`Failed to export slide ${i + 1}:`, error);
      throw new Error(`Failed to export slide ${i + 1}`);
    }
  }

  // Download PDF
  const filename = `${sanitizeFilename(presentation.title)}.pdf`;
  pdf.save(filename);
}

/**
 * Get PDF dimensions based on format
 *
 * @param format - Presentation format
 * @returns Dimensions object
 */
function getPDFDimensions(format: PresentationFormat): {
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
} {
  switch (format) {
    case "16:9":
      return {
        width: 297, // A4 landscape width
        height: 167, // 16:9 ratio
        orientation: "landscape",
      };
    case "4:3":
      return {
        width: 280,
        height: 210, // A4 portrait height
        orientation: "landscape",
      };
    case "A4":
      return {
        width: 210, // A4 portrait
        height: 297,
        orientation: "portrait",
      };
    default:
      return {
        width: 297,
        height: 167,
        orientation: "landscape",
      };
  }
}

/**
 * Sanitize filename
 *
 * @param filename - Original filename
 * @returns Sanitized filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()
    .substring(0, 50);
}
