/**
 * Fallback Handler Module
 *
 * Builds fallback prompts when API fails
 */

import { BrandingSettingsType } from "@/types/workflows/brandingSettings";
import { getBrandInfo } from "@/lib/api/agents/brandColorDatabase";

/**
 * Builds fallback prompt when API enhancement fails
 */
export function buildFallbackPrompt(
  userPrompt: string,
  settings?: BrandingSettingsType
): string {
  const parts: string[] = [
    "Exact same camera angle and perspective as source.",
    "Fully photorealistic rendering with no sketch lines.",
  ];

  if (settings?.brandingText) {
    const venuePart = settings.venueType ? ` ${settings.venueType}` : " space";
    parts.push(`Transform this into a ${settings.brandingText}${venuePart}.`);

    // Try to get brand info from database
    const brandInfo = getBrandInfo(settings.brandingText);

    if (brandInfo) {
      // Use database colors and materials (ACCURATE)
      parts.push(`Incorporate ${brandInfo.brandName} brand identity throughout:`);
      parts.push(`- Use ${brandInfo.brandName} brand colors: ${brandInfo.primaryColors.join(", ")} for walls, furniture, and decorative elements`);
      if (brandInfo.secondaryColors.length > 0) {
        parts.push(`- Add secondary brand colors: ${brandInfo.secondaryColors.join(", ")} as accent colors`);
      }
      parts.push(`- Apply ${brandInfo.brandName} characteristic materials: ${brandInfo.materials.join(", ")}`);
      parts.push(`- Display ${brandInfo.brandName} logos and branding on signage, walls, and product displays`);
      parts.push(`- Create ${brandInfo.atmosphere} with ${brandInfo.style} styling`);
    } else {
      // Fallback to generic (if brand not in database)
      parts.push(`Incorporate ${settings.brandingText} brand identity throughout:`);
      parts.push(`- Use ${settings.brandingText} signature brand colors on walls, furniture, and decorative elements`);
      parts.push(`- Display ${settings.brandingText} logos and branding on signage, walls, and displays`);
      parts.push(`- Apply ${settings.brandingText} characteristic materials and finishes`);
      parts.push(`- Create ${settings.brandingText} branded atmosphere with lighting and styling`);
    }
  }

  if (userPrompt && userPrompt.trim()) {
    parts.push(userPrompt.trim());
  }

  if (settings?.renderStyle) {
    parts.push(`${settings.renderStyle} rendering style.`);
  }

  if (settings?.timeOfDay) {
    parts.push(`${settings.timeOfDay} lighting.`);
  }

  // Add empty space instruction with specific examples
  if (settings?.preserveEmptySpace) {
    parts.push("Keep empty spaces minimal and unfurnished.");
  } else {
    // Specific furniture/decor for different venue types
    const venueType = settings?.venueType || "space";
    const brandName = settings?.brandingText || "branded";
    let furnitureExamples = "";

    if (venueType.includes("retail") || venueType.includes("store")) {
      furnitureExamples = `${brandName}-branded product display shelves, glass showcases with ${brandName} products, checkout counter with ${brandName} signage, seating areas with ${brandName} brand-colored chairs, wall-mounted screens showing ${brandName} branding, pendant lighting in ${brandName} colors, potted plants, ${brandName} logo displays, shopping baskets, display tables with ${brandName} merchandise`;
    } else if (venueType.includes("hotel") || venueType.includes("hospitality")) {
      furnitureExamples = `${brandName}-branded reception desk, lounge seating with sofas and armchairs in ${brandName} colors, coffee tables, decorative lamps, artwork featuring ${brandName} themes, area rugs with ${brandName} patterns, plants, luggage carts with ${brandName} branding, decorative pillows`;
    } else if (venueType.includes("restaurant") || venueType.includes("cafe")) {
      furnitureExamples = `dining tables and chairs in ${brandName} style, bar counter with ${brandName} signage, pendant lighting in ${brandName} colors, wall art featuring ${brandName} branding, potted plants, tableware displays with ${brandName} products, ${brandName} menu boards, decorative shelving with ${brandName} items`;
    } else if (venueType.includes("office")) {
      furnitureExamples = `desks with ${brandName} branding, office chairs in ${brandName} colors, meeting tables, filing cabinets, lounge seating with ${brandName} colors, desk lamps, whiteboards with ${brandName} logo, plants, bookshelves, ${brandName}-themed office decor`;
    } else {
      furnitureExamples = `seating (sofas, chairs, benches) in ${brandName} brand colors, tables, display units with ${brandName} products, shelving with ${brandName} branding, lighting fixtures (lamps, chandeliers, spotlights) in ${brandName} style, decorative elements (artwork featuring ${brandName}, plants, sculptures), rugs with ${brandName} patterns, cushions in ${brandName} colors`;
    }

    parts.push(`Fill the space with ${brandName}-branded furniture and decor including: ${furnitureExamples}.`);
  }

  parts.push("Professional architectural visualization with realistic materials, textures, and lighting.");

  return parts.join(" ");
}
