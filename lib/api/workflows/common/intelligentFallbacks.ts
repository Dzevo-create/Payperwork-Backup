/**
 * Intelligent Fallback Prompt Generators
 *
 * These functions generate decent prompts WITHOUT using GPT-4 Vision API.
 * Used when:
 * - OpenAI API quota is exceeded
 * - GPT-4 Vision API fails
 * - User wants faster/cheaper prompt generation
 *
 * Architecture:
 * - Uses workflow-specific settings to build prompts
 * - NO external API calls
 * - Fast and reliable
 * - Better than generic fallback strings
 *
 * @author Payperwork Team
 * @date 2025-01-20
 */

import type { WorkflowType } from './universalGptEnhancer';
import { buildSettingsContext } from './settingsContextBuilders';

// ============================================================================
// SKETCH-TO-RENDER INTELLIGENT FALLBACK
// ============================================================================

export function generateSketchToRenderFallback(
  userPrompt: string,
  settings: Record<string, any>
): string {
  const parts: string[] = [];

  // Start with base transformation
  const spaceType = settings.spaceType || 'architectural';
  const isInterior = spaceType === 'interior';

  parts.push(`Transform this ${isInterior ? 'interior' : 'exterior'} architectural sketch into a photorealistic rendering.`);

  // Add design style if present
  if (settings.designStyle) {
    parts.push(`Apply ${settings.designStyle} style with its characteristic materials, proportions, and design details.`);
  }

  // Add time and lighting
  if (settings.timeOfDay) {
    const timeDescriptions: Record<string, string> = {
      'morning': 'soft morning light with warm golden tones and long shadows',
      'midday': 'bright midday sunlight with clear visibility and minimal shadows',
      'afternoon': 'warm afternoon light with rich colors and moderate shadows',
      'evening': 'golden hour lighting with dramatic warm tones and atmospheric effects',
      'night': 'nighttime illumination with artificial lighting and ambient glow'
    };
    parts.push(`Use ${timeDescriptions[settings.timeOfDay] || settings.timeOfDay + ' lighting'}.`);
  }

  // Add weather and atmosphere
  if (settings.weather) {
    const weatherDescriptions: Record<string, string> = {
      'clear': 'clear skies with crisp visibility',
      'cloudy': 'overcast conditions with soft diffused lighting',
      'rainy': 'rainy atmosphere with wet surfaces and reflections',
      'foggy': 'misty foggy conditions with atmospheric depth'
    };
    parts.push(`Include ${weatherDescriptions[settings.weather] || settings.weather + ' conditions'}.`);
  }

  // Add season if present
  if (settings.season && !isInterior) {
    const seasonDescriptions: Record<string, string> = {
      'spring': 'spring vegetation with fresh green foliage and blooming flowers',
      'summer': 'lush summer greenery with vibrant colors',
      'autumn': 'autumn foliage with warm red, orange, and yellow tones',
      'winter': 'winter scene with bare trees and cold atmospheric effects'
    };
    parts.push(`Depict ${seasonDescriptions[settings.season] || settings.season + ' season'}.`);
  }

  // Add rendering quality
  if (settings.renderStyle) {
    parts.push(`Ensure ${settings.renderStyle} quality with professional architectural photography aesthetics.`);
  } else {
    parts.push(`Create a photorealistic rendering with professional quality, realistic materials, and natural lighting.`);
  }

  // Add user prompt if provided
  if (userPrompt && userPrompt.trim()) {
    parts.push(userPrompt.trim());
  }

  // Add preservation instruction
  parts.push(`Preserve the exact layout, proportions, and composition from the source sketch.`);

  return parts.join(' ');
}

// ============================================================================
// FURNISH-EMPTY INTELLIGENT FALLBACK
// ============================================================================

export function generateFurnishEmptyFallback(
  userPrompt: string,
  settings: Record<string, any>
): string {
  const parts: string[] = [];

  // Start with base transformation
  const spaceType = settings.spaceType || 'living room';
  parts.push(`Furnish this empty ${spaceType} with appropriate furniture and decor.`);

  // Add furnishing style
  if (settings.furnishingStyle) {
    parts.push(`Apply ${settings.furnishingStyle} style furnishings with matching decor and accessories.`);
  }

  // Add color scheme
  if (settings.colorScheme) {
    parts.push(`Use ${settings.colorScheme} color scheme throughout the space.`);
  }

  // Add furniture density
  if (settings.furnitureDensity) {
    const densityDescriptions: Record<string, string> = {
      'minimal': 'minimal furniture with plenty of open space',
      'moderate': 'balanced furniture arrangement with comfortable spacing',
      'full': 'fully furnished space with complete decor and accessories'
    };
    parts.push(`Include ${densityDescriptions[settings.furnitureDensity] || settings.furnitureDensity + ' furnishing density'}.`);
  }

  // Add target audience context
  if (settings.targetAudience) {
    parts.push(`Design for ${settings.targetAudience} appeal.`);
  }

  // Add user prompt if provided
  if (userPrompt && userPrompt.trim()) {
    parts.push(userPrompt.trim());
  }

  // Add preservation instruction
  parts.push(`Preserve the exact room architecture, walls, windows, doors, and flooring.`);
  parts.push(`Match the existing lighting conditions.`);

  return parts.join(' ');
}

// ============================================================================
// BRANDING INTELLIGENT FALLBACK
// ============================================================================

export function generateBrandingFallback(
  userPrompt: string,
  settings: Record<string, any>
): string {
  const parts: string[] = [];

  // Start with base transformation
  const venueType = settings.venueType || 'venue';
  parts.push(`Apply professional branding to this ${venueType}.`);

  // Add branding text
  if (settings.brandingText) {
    parts.push(`Incorporate "${settings.brandingText}" branding elements including logos, signage, and brand identity.`);
  }

  // Add render style
  if (settings.renderStyle) {
    parts.push(`Create ${settings.renderStyle} quality visualization.`);
  }

  // Add time of day
  if (settings.timeOfDay) {
    parts.push(`Use ${settings.timeOfDay} lighting.`);
  }

  // Add user prompt if provided
  if (userPrompt && userPrompt.trim()) {
    parts.push(userPrompt.trim());
  }

  // Add preservation instruction
  parts.push(`Maintain the core structure and form while adding branding elements.`);

  return parts.join(' ');
}

// ============================================================================
// STYLE-TRANSFER INTELLIGENT FALLBACK
// ============================================================================

export function generateStyleTransferFallback(
  userPrompt: string,
  settings: Record<string, any>
): string {
  const parts: string[] = [];

  // Start with base transformation
  parts.push(`Transfer the architectural style from the reference image to the source design.`);

  // Add architectural style if specified
  if (settings.architecturalStyle) {
    parts.push(`Apply ${settings.architecturalStyle} architectural style characteristics.`);
  }

  // Add transfer intensity
  if (settings.transferIntensity) {
    const intensity = settings.transferIntensity;
    if (intensity === 'subtle') {
      parts.push(`Apply subtle style influences while preserving most of the original design.`);
    } else if (intensity === 'moderate') {
      parts.push(`Apply moderate style transfer with balanced influence.`);
    } else if (intensity === 'strong') {
      parts.push(`Apply strong style transfer with significant transformation.`);
    }
  }

  // Add structure preservation
  if (settings.structurePreservation) {
    const preservation = settings.structurePreservation;
    if (preservation === 'high') {
      parts.push(`Preserve the original structure and layout closely.`);
    } else if (preservation === 'medium') {
      parts.push(`Maintain general structure while allowing style adaptations.`);
    } else if (preservation === 'low') {
      parts.push(`Allow structural modifications to match the reference style.`);
    }
  }

  // Add color scheme
  if (settings.colorScheme) {
    parts.push(`Transfer the ${settings.colorScheme} color palette from the reference.`);
  }

  // Add user prompt if provided
  if (userPrompt && userPrompt.trim()) {
    parts.push(userPrompt.trim());
  }

  return parts.join(' ');
}

// ============================================================================
// RENDER-TO-CAD INTELLIGENT FALLBACK
// ============================================================================

export function generateRenderToCadFallback(
  userPrompt: string,
  settings: Record<string, any>
): string {
  const parts: string[] = [];

  // Start with base transformation
  parts.push(`Convert this architectural rendering into a professional CAD technical drawing.`);

  // Add output type
  if (settings.outputType) {
    const outputTypes: Record<string, string> = {
      'floor-plan': 'floor plan with top-down view',
      'elevation': 'elevation view with orthographic projection',
      'section': 'section cut showing interior details',
      'axonometric': 'axonometric projection with 3D depth'
    };
    parts.push(`Create a ${outputTypes[settings.outputType] || settings.outputType}.`);
  }

  // Add detail level
  if (settings.detailLevel) {
    const detailLevels: Record<string, string> = {
      'basic': 'basic line work with essential elements',
      'standard': 'standard detail with dimensions and annotations',
      'detailed': 'high detail with comprehensive dimensions, notes, and specifications'
    };
    parts.push(`Include ${detailLevels[settings.detailLevel] || settings.detailLevel + ' detail level'}.`);
  }

  // Add standard CAD requirements
  parts.push(`Use proper CAD line weights, black lines on white background.`);
  parts.push(`Include architectural symbols and standard notation.`);

  // Add user prompt if provided
  if (userPrompt && userPrompt.trim()) {
    parts.push(userPrompt.trim());
  }

  // Add preservation instruction
  parts.push(`Preserve the exact spatial layout and proportions from the source image.`);

  return parts.join(' ');
}

// ============================================================================
// MAIN DISPATCHER
// ============================================================================

export function generateIntelligentFallback(
  workflowType: WorkflowType,
  userPrompt: string,
  settings: Record<string, any>
): string {
  switch (workflowType) {
    case 'sketch-to-render':
      return generateSketchToRenderFallback(userPrompt, settings);
    case 'furnish-empty':
      return generateFurnishEmptyFallback(userPrompt, settings);
    case 'branding':
      return generateBrandingFallback(userPrompt, settings);
    case 'style-transfer':
      return generateStyleTransferFallback(userPrompt, settings);
    case 'render-to-cad':
      return generateRenderToCadFallback(userPrompt, settings);
    default:
      return userPrompt || 'Transform this image with professional quality and realistic details.';
  }
}
