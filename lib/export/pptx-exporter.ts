// ============================================
// PPTX Exporter
// Version: 1.0
// Date: 2025-10-19
// ============================================

import PptxGenJS from "pptxgenjs";
import {
  Presentation,
  Slide,
  PresentationFormat,
  PresentationTheme,
} from "@/types/slides";

/**
 * Export presentation to PPTX
 *
 * @param presentation - Presentation metadata
 * @param slides - Array of slides
 * @returns Promise<void>
 */
export async function exportToPPTX(
  presentation: Presentation,
  slides: Slide[]
): Promise<void> {
  // Create presentation
  const pptx = new PptxGenJS();

  // Set metadata
  pptx.author = "Payperwork AI";
  pptx.company = "Payperwork";
  pptx.subject = presentation.prompt;
  pptx.title = presentation.title;

  // Set layout
  const layout = getPPTXLayout(presentation.format);
  pptx.layout = layout;

  // Get theme colors
  const colors = getThemeColors(presentation.theme);

  // Add slides
  for (const slide of slides) {
    const pptxSlide = pptx.addSlide();

    // Set background
    if (slide.background_color) {
      pptxSlide.background = {
        color: slide.background_color.replace("#", ""),
      };
    } else {
      pptxSlide.background = { color: colors.bg.replace("#", "") };
    }

    // Add content based on layout
    switch (slide.layout) {
      case "title_slide":
        addTitleSlide(pptxSlide, slide, colors);
        break;
      case "content":
        addContentSlide(pptxSlide, slide, colors);
        break;
      case "two_column":
        addTwoColumnSlide(pptxSlide, slide, colors);
        break;
      case "quote":
        addQuoteSlide(pptxSlide, slide, colors);
        break;
      case "image":
        addImageSlide(pptxSlide, slide, colors);
        break;
      default:
        addContentSlide(pptxSlide, slide, colors);
    }

    // Add speaker notes
    if (slide.speaker_notes) {
      pptxSlide.addNotes(slide.speaker_notes);
    }
  }

  // Download PPTX
  const filename = `${sanitizeFilename(presentation.title)}.pptx`;
  await pptx.writeFile({ fileName: filename });
}

/**
 * Add title slide
 */
function addTitleSlide(
  slide: any,
  data: Slide,
  colors: { primary: string; bg: string }
): void {
  // Title
  slide.addText(data.title, {
    x: 0.5,
    y: "40%",
    w: "90%",
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: colors.primary.replace("#", ""),
    align: "center",
    valign: "middle",
  });

  // Subtitle
  slide.addText(convertMarkdownToPlainText(data.content), {
    x: 0.5,
    y: "55%",
    w: "90%",
    h: 1,
    fontSize: 24,
    color: "666666",
    align: "center",
    valign: "middle",
  });
}

/**
 * Add content slide
 */
function addContentSlide(
  slide: any,
  data: Slide,
  colors: { primary: string; bg: string }
): void {
  // Title
  slide.addText(data.title, {
    x: 0.5,
    y: 0.5,
    w: "90%",
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: colors.primary.replace("#", ""),
  });

  // Content (convert Markdown to plain text)
  const plainText = convertMarkdownToPlainText(data.content);

  slide.addText(plainText, {
    x: 0.5,
    y: 1.5,
    w: "90%",
    h: "70%",
    fontSize: 18,
    color: "333333",
    valign: "top",
  });
}

/**
 * Add two column slide
 */
function addTwoColumnSlide(
  slide: any,
  data: Slide,
  colors: { primary: string; bg: string }
): void {
  // Title
  slide.addText(data.title, {
    x: 0.5,
    y: 0.5,
    w: "90%",
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: colors.primary.replace("#", ""),
  });

  // Split content into two columns
  const plainText = convertMarkdownToPlainText(data.content);
  const lines = plainText.split("\n");
  const midpoint = Math.ceil(lines.length / 2);
  const leftContent = lines.slice(0, midpoint).join("\n");
  const rightContent = lines.slice(midpoint).join("\n");

  // Left column
  slide.addText(leftContent, {
    x: 0.5,
    y: 1.5,
    w: "42%",
    h: "70%",
    fontSize: 16,
    color: "333333",
    valign: "top",
  });

  // Right column
  slide.addText(rightContent, {
    x: "52%",
    y: 1.5,
    w: "42%",
    h: "70%",
    fontSize: 16,
    color: "333333",
    valign: "top",
  });
}

/**
 * Add quote slide
 */
function addQuoteSlide(
  slide: any,
  data: Slide,
  colors: { primary: string; bg: string }
): void {
  // Quote
  slide.addText(`"${data.content}"`, {
    x: 0.5,
    y: "35%",
    w: "90%",
    h: 2,
    fontSize: 32,
    italic: true,
    color: colors.primary.replace("#", ""),
    align: "center",
    valign: "middle",
  });

  // Author
  slide.addText(`— ${data.title}`, {
    x: 0.5,
    y: "60%",
    w: "90%",
    h: 0.5,
    fontSize: 20,
    color: "666666",
    align: "center",
  });
}

/**
 * Add image slide
 */
function addImageSlide(
  slide: any,
  data: Slide,
  colors: { primary: string; bg: string }
): void {
  // Title
  slide.addText(data.title, {
    x: 0.5,
    y: 0.5,
    w: "90%",
    h: 0.8,
    fontSize: 32,
    bold: true,
    color: colors.primary.replace("#", ""),
  });

  // Image
  if (data.background_image) {
    slide.addImage({
      path: data.background_image,
      x: 0.5,
      y: 1.5,
      w: "90%",
      h: "70%",
    });
  } else {
    // Fallback to content if no image
    const plainText = convertMarkdownToPlainText(data.content);
    slide.addText(plainText, {
      x: 0.5,
      y: 1.5,
      w: "90%",
      h: "70%",
      fontSize: 18,
      color: "333333",
      valign: "top",
    });
  }
}

/**
 * Get PPTX layout
 */
function getPPTXLayout(format: PresentationFormat): string {
  switch (format) {
    case "16:9":
      return "LAYOUT_16x9";
    case "4:3":
      return "LAYOUT_4x3";
    case "A4":
      return "LAYOUT_A4";
    default:
      return "LAYOUT_16x9";
  }
}

/**
 * Get theme colors
 */
function getThemeColors(theme: PresentationTheme): {
  primary: string;
  bg: string;
} {
  const themes: Record<PresentationTheme, { primary: string; bg: string }> = {
    default: { primary: "#64748b", bg: "#f8fafc" },
    red: { primary: "#ef4444", bg: "#fef2f2" },
    rose: { primary: "#f43f5e", bg: "#fff1f2" },
    orange: { primary: "#f97316", bg: "#fff7ed" },
    green: { primary: "#22c55e", bg: "#f0fdf4" },
    blue: { primary: "#3b82f6", bg: "#eff6ff" },
    yellow: { primary: "#eab308", bg: "#fefce8" },
    violet: { primary: "#8b5cf6", bg: "#faf5ff" },
  };
  return themes[theme] || themes.default;
}

/**
 * Convert Markdown to plain text
 */
function convertMarkdownToPlainText(markdown: string): string {
  return markdown
    .replace(/#{1,6}\s/g, "") // Remove headers
    .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.+?)\*/g, "$1") // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Remove links
    .replace(/`(.+?)`/g, "$1") // Remove code
    .replace(/^\s*[-*+]\s/gm, "• ") // Convert lists
    .trim();
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase()
    .substring(0, 50);
}
