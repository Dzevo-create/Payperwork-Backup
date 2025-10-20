/**
 * Workflow-Specific Settings Context Builders
 *
 * This module contains intelligent settings-to-context converters for each workflow.
 * Instead of simple key-value lists, these create narrative descriptions that help
 * GPT-4 Vision understand what the user wants.
 *
 * Architecture:
 * - ONE function per workflow
 * - Each function knows its workflow's settings structure
 * - Outputs human-readable, contextual descriptions
 * - NO cross-workflow dependencies
 *
 * @author Payperwork Team
 * @date 2025-01-20
 */

import type { WorkflowType } from './universalGptEnhancer';

// ============================================================================
// SKETCH-TO-RENDER SETTINGS CONTEXT
// ============================================================================

export function buildSketchToRenderContext(settings: Record<string, any>): string {
  const lines: string[] = [];

  if (settings.spaceType) {
    lines.push(`- Space Type: ${settings.spaceType} (${settings.spaceType === 'interior' ? 'indoor space' : 'outdoor/exterior building'})`);
  }

  if (settings.designStyle) {
    lines.push(`- Architectural Style: ${settings.designStyle} (apply this style's characteristic materials, proportions, colors, and design details)`);
  }

  if (settings.renderStyle) {
    lines.push(`- Rendering Quality: ${settings.renderStyle} (ensure this level of realism and visual fidelity)`);
  }

  if (settings.timeOfDay) {
    lines.push(`- Time of Day: ${settings.timeOfDay} (adjust lighting angle, intensity, color temperature, and shadow direction accordingly)`);
  }

  if (settings.season) {
    lines.push(`- Season: ${settings.season} (include appropriate vegetation state, weather conditions, and atmospheric effects)`);
  }

  if (settings.weather) {
    lines.push(`- Weather Conditions: ${settings.weather} (adjust sky appearance, lighting quality, and atmospheric effects)`);
  }

  if (settings.aspectRatio) {
    lines.push(`- Output Format: ${settings.aspectRatio}`);
  }

  if (settings.quality) {
    lines.push(`- Quality Level: ${settings.quality} (level of detail and refinement)`);
  }

  return lines.length > 0
    ? lines.join('\n')
    : 'No specific settings provided - use professional architectural rendering best practices';
}

// ============================================================================
// FURNISH-EMPTY SETTINGS CONTEXT
// ============================================================================

export function buildFurnishEmptyContext(settings: Record<string, any>): string {
  const lines: string[] = [];

  if (settings.spaceType) {
    const spaceLabels: Record<string, string> = {
      'living_room': 'Living Room (furniture: sofas, coffee tables, TV units, shelving)',
      'bedroom': 'Bedroom (furniture: bed, nightstands, dressers, wardrobe)',
      'kitchen': 'Kitchen (already furnished - minimal staging)',
      'dining_room': 'Dining Room (furniture: dining table, chairs, sideboard)',
      'office': 'Office/Study (furniture: desk, office chair, bookcases, storage)',
      'bathroom': 'Bathroom (already furnished - minimal staging)',
      'kids_room': 'Kids Room/Nursery (furniture: crib/bed, toy storage, play area)',
      'guest_room': 'Guest Room (furniture: bed, seating, storage)',
      'hallway': 'Hallway/Entryway (furniture: console table, coat rack, mirror)',
      'balcony': 'Balcony/Terrace (furniture: outdoor seating, planters)',
      'terrace': 'Terrace/Patio (furniture: outdoor furniture set, umbrella)',
    };
    lines.push(`- Room Type: ${spaceLabels[settings.spaceType] || settings.spaceType}`);
  }

  if (settings.furnishingStyle) {
    const styleDescriptions: Record<string, string> = {
      'modern': 'Modern (clean lines, glass/metal materials, neutral colors, minimal ornamentation)',
      'scandinavian': 'Scandinavian (light wood, white/pastel colors, functional minimalism, cozy textiles)',
      'minimalist': 'Minimalist (very sparse furniture, monochrome palette, maximum negative space)',
      'industrial': 'Industrial (exposed materials, metal/concrete, raw finishes, utilitarian design)',
      'boho': 'Bohemian (eclectic mix, warm colors, natural materials, layered textiles, plants)',
      'farmhouse': 'Farmhouse (rustic wood, vintage accents, neutral warm tones, traditional forms)',
      'mid_century': 'Mid-Century Modern (organic curves, warm wood, retro colors, iconic designer pieces)',
      'classic': 'Classic/Traditional (symmetry, rich wood, elegant fabrics, ornate details)',
      'luxury': 'Luxury (high-end materials, plush fabrics, statement pieces, premium finishes)',
      'japandi': 'Japandi (Japanese+Scandinavian fusion, natural materials, muted colors, zen simplicity)',
      'coastal': 'Coastal (light colors, natural textures, beachy accents, airy feel)',
      'rustic': 'Rustic (raw wood, stone, earthy tones, handcrafted feel, natural imperfections)',
    };
    lines.push(`- Furnishing Style: ${styleDescriptions[settings.furnishingStyle] || settings.furnishingStyle}`);
  }

  if (settings.colorScheme) {
    lines.push(`- Color Scheme: ${settings.colorScheme} (apply to furniture fabrics, accents, and decor)`);
  }

  if (settings.furnitureDensity) {
    const densityDescriptions: Record<string, string> = {
      'minimal': 'Minimal (only essential pieces, maximum open space)',
      'normal': 'Normal (balanced furnishing, practical and comfortable)',
      'full': 'Full (complete furnishing with all typical room elements)',
      'luxury': 'Luxury (abundant high-end pieces, layered styling, premium accessories)',
    };
    lines.push(`- Furniture Density: ${densityDescriptions[settings.furnitureDensity] || settings.furnitureDensity}`);
  }

  if (settings.lighting) {
    const lightingDescriptions: Record<string, string> = {
      'natural_daylight': 'Natural Daylight (bright, fresh, window light dominant)',
      'warm_evening': 'Warm Evening (soft, golden, cozy lamp lighting)',
      'bright_artificial': 'Bright Artificial (even, crisp, overhead lighting)',
      'cozy': 'Cozy (dim, warm, intimate ambient lighting)',
      'dramatic': 'Dramatic (high contrast, directional, accent lighting)',
    };
    lines.push(`- Lighting Atmosphere: ${lightingDescriptions[settings.lighting] || settings.lighting}`);
  }

  if (settings.targetAudience) {
    const audienceDescriptions: Record<string, string> = {
      'family': 'Family (practical, durable, child-friendly)',
      'single': 'Single Professional (contemporary, stylish, functional)',
      'couple': 'Couple (romantic, comfortable, sophisticated)',
      'seniors': 'Seniors (accessible, comfortable, classic)',
      'students': 'Students (affordable, functional, compact)',
      'luxury_buyers': 'Luxury Buyers (high-end, statement pieces, premium)',
      'first_time_renters': 'First-Time Renters (move-in ready, modern, affordable)',
    };
    lines.push(`- Target Audience: ${audienceDescriptions[settings.targetAudience] || settings.targetAudience}`);
  }

  if (settings.materials && Array.isArray(settings.materials) && settings.materials.length > 0) {
    lines.push(`- Preferred Materials: ${settings.materials.join(', ')} (emphasize these in furniture and decor)`);
  }

  if (settings.structureAdherence !== undefined) {
    lines.push(`- Structure Preservation: ${settings.structureAdherence}% (${settings.structureAdherence >= 90 ? 'STRICT - preserve exact room architecture' : settings.structureAdherence >= 70 ? 'MODERATE - maintain overall room layout' : 'FLEXIBLE - can adjust minor details'})`);
  }

  return lines.length > 0
    ? lines.join('\n')
    : 'No specific settings provided - use professional staging best practices for empty room furnishing';
}

// ============================================================================
// BRANDING SETTINGS CONTEXT
// ============================================================================

export function buildBrandingContext(settings: Record<string, any>): string {
  const lines: string[] = [];

  if (settings.spaceType) {
    lines.push(`- Space Type: ${settings.spaceType}`);
  }

  if (settings.venueType) {
    const venueDescriptions: Record<string, string> = {
      'retail': 'Retail Store (product displays, signage, brand consistency)',
      'concert': 'Concert Venue (stage branding, banners, LED screens)',
      'event': 'Event Space (branded backdrops, signage, decor)',
      'wedding': 'Wedding Venue (elegant branded decor, monograms, colors)',
      'restaurant': 'Restaurant (branded menus, signage, ambiance)',
      'hotel': 'Hotel (branded lobby, room decor, amenities)',
      'office': 'Office Space (corporate branding, professional environment)',
      'exhibition': 'Exhibition/Trade Show (booth branding, displays, materials)',
      'club': 'Nightclub (LED branding, dynamic lighting, signage)',
      'festival': 'Festival (large-scale banners, signage, branded areas)',
    };
    lines.push(`- Venue Type: ${venueDescriptions[settings.venueType] || settings.venueType}`);
  }

  if (settings.brandingText) {
    lines.push(`- Branding Text/Logo: "${settings.brandingText}" (apply this text/brand name prominently where appropriate)`);
  }

  if (settings.renderStyle) {
    lines.push(`- Rendering Quality: ${settings.renderStyle}`);
  }

  if (settings.timeOfDay) {
    lines.push(`- Time of Day: ${settings.timeOfDay} (adjust lighting and atmosphere accordingly)`);
  }

  if (settings.quality) {
    lines.push(`- Quality Level: ${settings.quality}`);
  }

  if (settings.structureFidelity !== undefined) {
    lines.push(`- Structure Fidelity: ${settings.structureFidelity}% (${settings.structureFidelity >= 90 ? 'STRICT - preserve exact spatial layout' : settings.structureFidelity >= 70 ? 'MODERATE - maintain overall composition' : 'FLEXIBLE - can adjust for branding'})`);
  }

  if (settings.preserveEmptySpace !== undefined) {
    lines.push(`- Empty Space Policy: ${settings.preserveEmptySpace ? 'PRESERVE empty areas as-is' : 'ALLOW AI to utilize empty space for enhanced branding'}`);
  }

  if (settings.aspectRatio) {
    lines.push(`- Output Format: ${settings.aspectRatio}`);
  }

  return lines.length > 0
    ? lines.join('\n')
    : 'No specific settings provided - apply professional branding best practices';
}

// ============================================================================
// STYLE-TRANSFER SETTINGS CONTEXT
// ============================================================================

export function buildStyleTransferContext(settings: Record<string, any>): string {
  const lines: string[] = [];

  if (settings.architecturalStyle) {
    lines.push(`- Target Architectural Style: ${settings.architecturalStyle} (if reference image doesn't match, blend reference characteristics with this style)`);
  }

  if (settings.transferIntensity) {
    const intensityDescriptions: Record<string, string> = {
      'subtle': 'Subtle Transfer (gentle style hints, maintain source character)',
      'balanced': 'Balanced Transfer (50/50 blend of source and reference)',
      'strong': 'Strong Transfer (dominant reference style, minimal source character)',
    };
    lines.push(`- Transfer Intensity: ${intensityDescriptions[settings.transferIntensity] || settings.transferIntensity}`);
  }

  if (settings.styleStrength !== undefined) {
    lines.push(`- Style Strength: ${settings.styleStrength}% (how strongly to apply reference style characteristics)`);
  }

  if (settings.structurePreservation !== undefined) {
    lines.push(`- Structure Preservation: ${settings.structurePreservation}% (${settings.structurePreservation >= 90 ? 'STRICT - maintain exact source layout' : settings.structurePreservation >= 70 ? 'MODERATE - preserve overall composition' : 'FLEXIBLE - can adjust proportions for style'})`);
  }

  if (settings.materialPalette) {
    const paletteDescriptions: Record<string, string> = {
      'natural': 'Natural Materials (wood, stone, brick, natural fibers)',
      'industrial': 'Industrial Materials (metal, concrete, glass, exposed structure)',
      'luxury': 'Luxury Materials (marble, brass, high-end finishes, premium textures)',
      'rustic': 'Rustic Materials (weathered wood, rough stone, aged patina)',
      'modern': 'Modern Materials (smooth concrete, glass, steel, synthetic)',
      'traditional': 'Traditional Materials (brick, plaster, wood paneling, classic finishes)',
      'mixed': 'Mixed Materials (eclectic combination respecting reference)',
    };
    lines.push(`- Material Palette: ${paletteDescriptions[settings.materialPalette] || settings.materialPalette}`);
  }

  if (settings.colorScheme) {
    lines.push(`- Color Scheme: ${settings.colorScheme} (apply this color palette in materials and finishes)`);
  }

  if (settings.accentColor) {
    lines.push(`- Accent Color: ${settings.accentColor} (use as highlighting color in details and features)`);
  }

  return lines.length > 0
    ? lines.join('\n')
    : 'No specific settings provided - transfer all style characteristics from reference image naturally';
}

// ============================================================================
// RENDER-TO-CAD SETTINGS CONTEXT
// ============================================================================

export function buildRenderToCadContext(settings: Record<string, any>): string {
  const lines: string[] = [];

  if (settings.outputType) {
    const outputDescriptions: Record<string, string> = {
      'with_metadata': 'With Metadata (include dimensions, annotations, material callouts, notes)',
      'without_metadata': 'Without Metadata (clean line drawing only, no text annotations)',
    };
    lines.push(`- Output Type: ${outputDescriptions[settings.outputType] || settings.outputType}`);
  }

  if (settings.detailLevel) {
    const detailDescriptions: Record<string, string> = {
      'overview': 'Overview (schematic level, basic outlines, key features only)',
      'standard': 'Standard (typical construction drawing detail, primary dimensions)',
      'detailed': 'Detailed (comprehensive technical drawing, full dimensioning, all elements)',
    };
    lines.push(`- Detail Level: ${detailDescriptions[settings.detailLevel] || settings.detailLevel}`);
  }

  return lines.length > 0
    ? lines.join('\n')
    : 'Standard CAD output with metadata and standard detail level';
}

// ============================================================================
// UNIVERSAL SETTINGS CONTEXT BUILDER (DISPATCHER)
// ============================================================================

/**
 * Main dispatcher function that routes to workflow-specific builders
 */
export function buildSettingsContext(
  workflowType: WorkflowType,
  settings: Record<string, any>
): string {
  switch (workflowType) {
    case 'sketch-to-render':
      return buildSketchToRenderContext(settings);
    case 'furnish-empty':
      return buildFurnishEmptyContext(settings);
    case 'branding':
      return buildBrandingContext(settings);
    case 'style-transfer':
      return buildStyleTransferContext(settings);
    case 'render-to-cad':
      return buildRenderToCadContext(settings);
    default:
      // Fallback to generic key-value formatting
      const lines: string[] = [];
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined && value !== null && value !== '') {
          const label = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
          lines.push(`- ${label}: ${value}`);
        }
      }
      return lines.join('\n') || 'No settings provided';
  }
}
