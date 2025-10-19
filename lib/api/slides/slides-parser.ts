// ============================================
// Slides Parser
// Version: 1.0
// Date: 2025-10-19
// ============================================

import { SlideLayout } from "@/types/slides";

/**
 * Parsed slide before database insertion
 */
export interface ParsedSlide {
  title: string;
  content: string;
  layout: SlideLayout;
  order_index: number;
  speaker_notes?: string;
  background_color?: string;
  background_image?: string;
}

/**
 * Parse Manus webhook response and extract slides
 *
 * @param webhookData - Webhook data from Manus API
 * @returns Array of parsed slides
 */
export async function parseManusSlidesResponse(
  webhookData: any
): Promise<ParsedSlide[]> {
  try {
    // Check if webhook has the correct event type
    if (webhookData.event_type !== "task_stopped") {
      throw new Error(
        `Invalid webhook event type: ${webhookData.event_type}. Expected: task_stopped`
      );
    }

    // Check stop reason
    if (webhookData.stop_reason !== "finish") {
      throw new Error(
        `Task did not finish successfully. Reason: ${webhookData.stop_reason}`
      );
    }

    // Extract attachments
    const attachments = webhookData.attachments || [];

    if (attachments.length === 0) {
      throw new Error("No attachments found in webhook response");
    }

    // Look for JSON attachment with slides data
    let slidesData: any = null;

    for (const attachment of attachments) {
      // Check if attachment is JSON
      if (
        attachment.type === "json" ||
        attachment.content_type === "application/json" ||
        attachment.url?.endsWith(".json")
      ) {
        // If attachment has URL, fetch it
        if (attachment.url) {
          slidesData = await fetchJSONFromURL(attachment.url);
        }
        // If attachment has inline content
        else if (attachment.content) {
          slidesData =
            typeof attachment.content === "string"
              ? JSON.parse(attachment.content)
              : attachment.content;
        }

        // If we found slides data, break
        if (slidesData?.slides) {
          break;
        }
      }
    }

    // If no slides data found, check if response has slides directly
    if (!slidesData?.slides && webhookData.slides) {
      slidesData = { slides: webhookData.slides };
    }

    if (!slidesData?.slides) {
      throw new Error("No slides data found in webhook response");
    }

    // Parse each slide
    const parsedSlides: ParsedSlide[] = slidesData.slides.map(
      (slide: any, index: number) => parseSlide(slide, index)
    );

    // Validate parsed slides
    validateParsedSlides(parsedSlides);

    return parsedSlides;
  } catch (error: any) {
    console.error("Error parsing Manus slides response:", error);
    throw new Error(`Failed to parse slides: ${error.message}`);
  }
}

/**
 * Parse a single slide from Manus response
 *
 * @param slide - Raw slide data from Manus
 * @param index - Slide index (for ordering)
 * @returns Parsed slide
 */
function parseSlide(slide: any, index: number): ParsedSlide {
  // Validate required fields
  if (!slide.title || typeof slide.title !== "string") {
    throw new Error(`Slide ${index} is missing a valid title`);
  }

  if (!slide.content || typeof slide.content !== "string") {
    throw new Error(`Slide ${index} is missing valid content`);
  }

  // Validate layout
  const validLayouts: SlideLayout[] = [
    "title_slide",
    "content",
    "two_column",
    "image",
    "quote",
  ];

  const layout: SlideLayout = validLayouts.includes(slide.layout)
    ? slide.layout
    : "content"; // Default to content if invalid

  // Parse optional fields
  const speakerNotes =
    slide.speaker_notes && typeof slide.speaker_notes === "string"
      ? slide.speaker_notes
      : undefined;

  const backgroundColor =
    slide.background_color && typeof slide.background_color === "string"
      ? slide.background_color
      : undefined;

  const backgroundImage =
    slide.background_image && typeof slide.background_image === "string"
      ? slide.background_image
      : undefined;

  return {
    title: slide.title.trim(),
    content: slide.content.trim(),
    layout,
    order_index: index,
    speaker_notes: speakerNotes?.trim(),
    background_color: backgroundColor?.trim(),
    background_image: backgroundImage?.trim(),
  };
}

/**
 * Fetch JSON from URL
 *
 * @param url - URL to fetch JSON from
 * @returns Parsed JSON data
 */
async function fetchJSONFromURL(url: string): Promise<any> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching JSON from URL:", error);
    throw new Error(`Failed to fetch JSON: ${error.message}`);
  }
}

/**
 * Validate parsed slides
 *
 * @param slides - Array of parsed slides
 */
function validateParsedSlides(slides: ParsedSlide[]): void {
  // Check minimum slides
  if (slides.length < 1) {
    throw new Error("Presentation must have at least 1 slide");
  }

  // Check maximum slides
  if (slides.length > 50) {
    throw new Error("Presentation cannot have more than 50 slides");
  }

  // Check for duplicate order indices
  const orderIndices = slides.map((s) => s.order_index);
  const uniqueIndices = new Set(orderIndices);

  if (orderIndices.length !== uniqueIndices.size) {
    throw new Error("Duplicate slide order indices found");
  }

  // Validate each slide
  slides.forEach((slide, index) => {
    // Check title length
    if (slide.title.length === 0) {
      throw new Error(`Slide ${index} has an empty title`);
    }

    if (slide.title.length > 200) {
      throw new Error(
        `Slide ${index} title exceeds maximum length of 200 characters`
      );
    }

    // Check content length
    if (slide.content.length === 0) {
      throw new Error(`Slide ${index} has empty content`);
    }

    if (slide.content.length > 5000) {
      throw new Error(
        `Slide ${index} content exceeds maximum length of 5000 characters`
      );
    }

    // Validate order index
    if (slide.order_index < 0) {
      throw new Error(`Slide ${index} has invalid order_index`);
    }

    // Validate speaker notes length
    if (slide.speaker_notes && slide.speaker_notes.length > 2000) {
      throw new Error(
        `Slide ${index} speaker notes exceed maximum length of 2000 characters`
      );
    }

    // Validate background color format (if provided)
    if (slide.background_color) {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(slide.background_color)) {
        throw new Error(
          `Slide ${index} has invalid background_color format. Expected hex color (e.g., #FF5733)`
        );
      }
    }

    // Validate background image URL format (if provided)
    if (slide.background_image) {
      try {
        new URL(slide.background_image);
      } catch {
        throw new Error(
          `Slide ${index} has invalid background_image URL format`
        );
      }
    }
  });

  // Validate order indices are sequential (0, 1, 2, ...)
  const sortedIndices = [...orderIndices].sort((a, b) => a - b);
  for (let i = 0; i < sortedIndices.length; i++) {
    if (sortedIndices[i] !== i) {
      throw new Error(
        "Slide order indices must be sequential starting from 0"
      );
    }
  }
}
