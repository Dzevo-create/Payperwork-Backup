// lib/api/workflows/renderToCad/promptGenerator.ts

import { RenderToCadSettingsType } from "@/types/workflows/renderToCadSettings";

/**
 * Generate AI prompt for Render-to-CAD workflow (Simplified to 2 Settings)
 *
 * Converts architectural renderings or photos into technical CAD-style drawings
 * using the provided settings to control output style and detail level.
 */
export function generateRenderToCadPrompt(
  userPrompt: string,
  settings: RenderToCadSettingsType
): string {
  const {
    outputType,
    detailLevel,
  } = settings;

  const parts: string[] = [];

  // Base instruction
  parts.push("Generate a professional technical CAD drawing from the provided architectural image.");

  // Detail Level
  switch (detailLevel) {
    case "overview":
      parts.push("Focus on main structural elements only (walls, openings, basic layout).");
      parts.push("Minimal annotations and dimensioning.");
      break;
    case "standard":
      parts.push("Include balanced detail with main elements, key dimensions, and essential annotations.");
      parts.push("Standard dimensioning for walls, openings, and spaces.");
      break;
    case "detailed":
      parts.push("Include comprehensive detail with all elements, full dimensioning, material symbols, and complete annotations.");
      parts.push("Detailed dimensioning, hatching, symbols, and technical notes.");
      break;
  }

  // Output Type - whether to include metadata in the generated CAD
  if (outputType === "with_metadata") {
    parts.push("Include embedded metadata with dimensional information, layer organization, and technical specifications in the CAD output.");
    parts.push("Add comprehensive annotations, dimension values, and technical notes.");
  } else {
    parts.push("Generate clean CAD drawing without embedded metadata or extensive annotations.");
    parts.push("Focus on visual clarity with minimal text and annotations.");
  }

  // Technical CAD requirements
  parts.push("\nTechnical Requirements:");
  parts.push("- Black lines on white background");
  parts.push("- Professional line weights (0.13mm for thin, 0.35mm for medium, 0.50mm for thick)");
  parts.push("- Standard architectural symbols (door swings, window markers, etc.)");
  parts.push("- Clear dimensioning with extension lines and dimension text");
  parts.push("- Proper annotations with leader lines where needed");
  parts.push("- All text horizontal and readable");
  parts.push("- Scale notation in title block or corner");

  // User prompt - additional requirements
  if (userPrompt.trim()) {
    parts.push(`\nAdditional Requirements from User: ${userPrompt.trim()}`);
  }

  return parts.join(" ");
}

/**
 * Get detail level label for display
 */
export function getDetailLevelLabel(level: string): string {
  switch (level) {
    case "overview":
      return "Übersicht";
    case "standard":
      return "Standard";
    case "detailed":
      return "Detailliert";
    default:
      return level;
  }
}

/**
 * Get output type label for display
 */
export function getOutputTypeLabel(type: string): string {
  switch (type) {
    case "with_metadata":
      return "Mit Metadaten";
    case "without_metadata":
      return "Ohne Metadaten";
    default:
      return type;
  }
}
