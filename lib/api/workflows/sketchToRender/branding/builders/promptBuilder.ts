/**
 * Prompt Builder Module
 *
 * Builds prompt text from settings and brand context
 */

import { BrandingSettingsType } from "@/types/workflows/brandingSettings";
import { FIDELITY_GUIDES } from "../constants";

/**
 * Gets structure fidelity instruction based on value (0-100)
 */
export function getStructureFidelityInstruction(fidelity?: number | null): string {
  const normalizedFidelity = fidelity ?? 100;
  const key = String(Math.round(normalizedFidelity / 10) * 10);
  return FIDELITY_GUIDES[key] || FIDELITY_GUIDES["100"] || "EXACT structure preservation - Same camera angle, layout, proportions. Only materials/colors change.";
}

/**
 * Builds settings context string from branding settings
 */
export function buildSettingsContext(settings?: BrandingSettingsType): string {
  if (!settings) return "";

  const contextParts: string[] = [];

  if (settings.spaceType) {
    contextParts.push(`Space type: ${settings.spaceType}`);
  }

  if (settings.venueType) {
    contextParts.push(`Venue: ${settings.venueType}`);
  }

  if (settings.renderStyle) {
    contextParts.push(`Render style: ${settings.renderStyle}`);
  }

  if (settings.timeOfDay) {
    contextParts.push(`Time: ${settings.timeOfDay}`);
  }

  if (settings.quality) {
    contextParts.push(`Quality: ${settings.quality}`);
  }

  // Add empty space preservation instruction (CRITICAL - affects space transformation)
  if (settings.preserveEmptySpace) {
    contextParts.push(`Empty Space: PRESERVE - Keep minimal/empty spaces as they are. Do NOT add furniture, decorations, or fill empty walls. Maintain minimalist aesthetic.`);
  } else {
    contextParts.push(`Empty Space: TRANSFORM TO FURNISHED - CRITICAL INSTRUCTION: You MUST add furniture, decorations, artwork, plants, lighting fixtures, and brand-specific elements to ALL empty walls and floor spaces. Convert empty/minimal rooms into fully furnished, detailed branded environments. Do NOT leave any significant empty areas unfurnished. Add specific items like: sofas, chairs, tables, shelves, wall art, plants, rugs, lamps, display units, and brand merchandising. Every empty wall should have decoration or branding elements. Every empty floor area should have furniture or displays.`);
  }

  return contextParts.length > 0 ? `\n\nSettings:\n${contextParts.join("\n")}` : "";
}

/**
 * Builds furniture instruction if space should be furnished
 */
export function buildFurnitureInstruction(preserveEmptySpace?: boolean): string {
  if (preserveEmptySpace) return "";

  return `\n\nPlease create a furniture-focused prompt:
- Include 5-7 specific furniture items (chairs, tables, sofas, shelving, displays, counters)
- Include 3-4 decorative elements (artwork, plants, sculptures, rugs)
- Include 2-3 lighting fixtures (lamps, chandeliers, spotlights)
- Focus on objects and furnishings that fill the space
- Describe the desired furnished result`;
}

/**
 * Builds the starting instruction for the prompt
 */
export function buildStartingInstruction(
  brandName?: string,
  venueType?: string
): string {
  const brand = brandName || "branded";
  const venue = venueType || "space";
  return `\n\nPlease start with: "Exact same camera angle and perspective as source. Transform this space into a ${brand} ${venue}."`;
}

/**
 * Builds complete user message for enhancement
 */
export function buildEnhancementUserMessage(
  userPrompt: string,
  brandContext: string,
  settings?: BrandingSettingsType
): string {
  let message = `Create a photorealistic rendering prompt for transforming this space.`;

  // Add brand context
  if (brandContext) {
    message += `\n\n${brandContext}`;
  }

  // Add user's style preferences
  if (userPrompt && userPrompt.trim()) {
    message += `\n\nUser style preferences: ${userPrompt.trim()}`;
  }

  // Add settings context
  const settingsContext = buildSettingsContext(settings);
  if (settingsContext) {
    message += settingsContext;
  }

  // Add furniture instruction
  message += buildFurnitureInstruction(settings?.preserveEmptySpace ?? undefined);

  // Add starting instruction
  message += buildStartingInstruction(settings?.brandingText ?? undefined, settings?.venueType ?? undefined);

  return message;
}
