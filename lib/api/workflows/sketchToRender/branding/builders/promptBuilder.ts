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
    if (settings.spaceType === "exterior") {
      contextParts.push(`Empty Space: PRESERVE - Keep open outdoor spaces as they are. Do NOT add unnecessary outdoor furniture, decorations, or clutter. Maintain clean, minimalist exterior aesthetic with focus on architecture and essential branding.`);
    } else {
      contextParts.push(`Empty Space: PRESERVE - Keep minimal/empty spaces as they are. Do NOT add furniture, decorations, or fill empty walls. Maintain minimalist aesthetic.`);
    }
  } else {
    if (settings.spaceType === "exterior") {
      contextParts.push(`Empty Space: TRANSFORM TO BRANDED EXTERIOR - CRITICAL INSTRUCTION: You MUST add outdoor branding elements, signage, atmospheric details, and environmental enhancements. Transform bare exteriors into vibrant, branded outdoor spaces with: large brand signage, entrance branding, outdoor displays, landscape elements (plants, lighting), atmospheric effects (people, weather), branded architectural features. Every visible wall should have brand identity elements.`);
    } else {
      contextParts.push(`Empty Space: TRANSFORM TO FURNISHED - CRITICAL INSTRUCTION: You MUST add furniture, decorations, artwork, plants, lighting fixtures, and brand-specific elements to ALL empty walls and floor spaces. Convert empty/minimal rooms into fully furnished, detailed branded environments. Do NOT leave any significant empty areas unfurnished. Add specific items like: sofas, chairs, tables, shelves, wall art, plants, rugs, lamps, display units, and brand merchandising. Every empty wall should have decoration or branding elements. Every empty floor area should have furniture or displays.`);
    }
  }

  return contextParts.length > 0 ? `\n\nSettings:\n${contextParts.join("\n")}` : "";
}

/**
 * Builds furniture instruction if space should be furnished
 */
export function buildFurnitureInstruction(
  preserveEmptySpace?: boolean,
  spaceType?: "interior" | "exterior" | null
): string {
  if (preserveEmptySpace) return "";

  // For exteriors, use different furnishing instructions
  if (spaceType === "exterior") {
    return `\n\nPlease create an exterior-focused prompt:
- Include outdoor branding elements (signage, logos, banners, displays)
- Include exterior fixtures (lighting, awnings, entrance features)
- Include landscape elements (plants, planters, outdoor furniture if applicable)
- Include atmospheric elements (people, weather, time of day effects)
- Focus on branded architectural features and outdoor environment
- Describe the desired branded exterior result`;
  }

  // For interiors, use furniture-focused instructions
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
  venueType?: string,
  spaceType?: "interior" | "exterior" | null
): string {
  const brand = brandName || "branded";
  const venue = venueType || "space";
  const spaceDescription = spaceType === "exterior" ? "building exterior/facade" : "space";
  return `\n\nPlease start with: "Exact same camera angle and perspective as source. Transform this ${spaceDescription} into a ${brand} ${venue}."`;
}

/**
 * Builds complete user message for enhancement
 */
export function buildEnhancementUserMessage(
  userPrompt: string,
  brandContext: string,
  settings?: BrandingSettingsType
): string {
  // CRITICAL: Start with space type declaration to prevent GPT-4o confusion
  const isExterior = settings?.spaceType === "exterior";
  let message = isExterior
    ? `CRITICAL: This is an EXTERIOR building/facade. Create a photorealistic rendering prompt for transforming this EXTERIOR space. DO NOT describe interior furniture, displays, or indoor elements. Focus ONLY on exterior architectural branding, facade treatments, signage, and outdoor elements.`
    : `Create a photorealistic rendering prompt for transforming this INTERIOR space.`;

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

  // Add furniture/exterior instruction
  message += buildFurnitureInstruction(
    settings?.preserveEmptySpace ?? undefined,
    settings?.spaceType ?? undefined
  );

  // Add starting instruction
  message += buildStartingInstruction(
    settings?.brandingText ?? undefined,
    settings?.venueType ?? undefined,
    settings?.spaceType ?? undefined
  );

  return message;
}
