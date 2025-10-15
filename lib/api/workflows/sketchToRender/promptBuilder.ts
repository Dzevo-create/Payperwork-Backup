/**
 * Prompt Builder for Sketch-to-Render Workflow
 *
 * Builds enhanced architectural rendering prompts from user input and render settings.
 * Similar to buildEnhancedImagePrompt pattern in lib/api/providers/gemini.ts
 */

import { RenderSettingsType } from "@/types/workflows/renderSettings";

/**
 * Design style descriptions for architectural rendering
 * Maps design styles to detailed prompt enhancements
 */
const DESIGN_STYLE_DESCRIPTIONS: Record<string, string> = {
  modern: "modern architecture with clean lines and contemporary design",
  minimalist: "minimalist design with clean lines and simple elegance",
  mediterranean: "mediterranean style with warm tones, arches, and natural materials",
  scandinavian: "scandinavian design with light woods, white tones, and functional elegance",
  industrial: "industrial style with exposed materials, metal, and raw textures",
  classical: "classical architecture with traditional proportions and timeless details",
  contemporary: "contemporary design with current trends and innovative elements",
  rustic: "rustic style with natural materials, wood, and warm character",
  bauhaus: "bauhaus design with functional forms and geometric simplicity",
  "art-deco": "art deco style with geometric patterns and luxurious details",
  japanese: "japanese aesthetic with zen principles and natural harmony",
  tropical: "tropical design with natural ventilation, lush greenery, and open spaces",
  brutalist: "brutalist architecture with raw concrete and bold geometric forms",
};

/**
 * Render style descriptions
 * Maps render styles to technical prompt enhancements
 */
const RENDER_STYLE_DESCRIPTIONS: Record<string, string> = {
  hyperrealistic: "hyperrealistic rendering, ultra detailed, maximum realism",
  photorealistic: "photorealistic rendering, professional architectural photography quality",
  "3d-render": "high quality 3D architectural rendering, polished and refined",
  "architectural-visualization": "professional architectural visualization, presentation quality",
  "concept-art": "architectural concept art, artistic interpretation with technical accuracy",
};

/**
 * Time of day descriptions
 * Maps times to lighting and atmosphere descriptions
 */
const TIME_OF_DAY_DESCRIPTIONS: Record<string, string> = {
  morning: "morning light, soft golden hour illumination, fresh atmosphere",
  midday: "midday lighting, bright and clear, full natural illumination",
  afternoon: "afternoon light, warm natural lighting",
  evening: "evening light, golden hour, warm atmospheric glow",
  night: "night scene, artificial lighting, dramatic atmosphere",
};

/**
 * Season descriptions
 * Maps seasons to environmental context
 */
const SEASON_DESCRIPTIONS: Record<string, string> = {
  spring: "spring season, fresh greenery, blooming plants",
  summer: "summer season, lush vegetation, vibrant environment",
  autumn: "autumn season, warm colors, changing foliage",
  winter: "winter season, crisp atmosphere, seasonal character",
};

/**
 * Weather descriptions
 * Maps weather conditions to atmospheric effects
 */
const WEATHER_DESCRIPTIONS: Record<string, string> = {
  sunny: "sunny weather, clear sky, bright natural lighting",
  cloudy: "cloudy weather, diffused lighting, soft shadows",
  rainy: "rainy weather, wet surfaces, atmospheric moisture",
  foggy: "foggy weather, misty atmosphere, reduced visibility",
};

/**
 * Quality descriptions
 * Maps quality levels to technical specifications
 */
const QUALITY_DESCRIPTIONS: Record<string, string> = {
  ultra: "ultra high quality, 8K resolution, maximum detail and precision",
  high: "high quality, 4K resolution, detailed rendering",
  standard: "professional quality rendering",
};

/**
 * Space type descriptions
 * Maps space types to context
 */
const SPACE_TYPE_DESCRIPTIONS: Record<string, string> = {
  interior: "interior architectural space",
  exterior: "exterior architectural view",
};

/**
 * Builds an enhanced architectural rendering prompt from user input and settings
 *
 * @param userPrompt - The user's base prompt
 * @param settings - Optional render settings to enhance the prompt
 * @returns Enhanced prompt string with architectural details
 *
 * @example
 * ```typescript
 * const prompt = buildArchitecturalPrompt(
 *   "modern living room",
 *   {
 *     designStyle: "modern",
 *     renderStyle: "photorealistic",
 *     timeOfDay: "evening",
 *     quality: "ultra"
 *   }
 * );
 * // Returns: "modern living room, modern architecture with clean lines..., photorealistic..."
 * ```
 */
export function buildArchitecturalPrompt(
  userPrompt: string,
  settings?: RenderSettingsType
): string {
  // Start with user prompt (or default)
  let prompt = userPrompt?.trim() || "architectural rendering";

  // If no settings provided, return the base prompt
  if (!settings) {
    return prompt;
  }

  const enhancements: string[] = [];

  // Add space type context (if selected)
  if (settings.spaceType && SPACE_TYPE_DESCRIPTIONS[settings.spaceType]) {
    enhancements.push(SPACE_TYPE_DESCRIPTIONS[settings.spaceType]);
  }

  // Add design style (if selected)
  if (settings.designStyle && DESIGN_STYLE_DESCRIPTIONS[settings.designStyle]) {
    enhancements.push(DESIGN_STYLE_DESCRIPTIONS[settings.designStyle]);
  }

  // Add render style (if selected)
  if (settings.renderStyle && RENDER_STYLE_DESCRIPTIONS[settings.renderStyle]) {
    enhancements.push(RENDER_STYLE_DESCRIPTIONS[settings.renderStyle]);
  }

  // Add time of day (if selected)
  if (settings.timeOfDay && TIME_OF_DAY_DESCRIPTIONS[settings.timeOfDay]) {
    enhancements.push(TIME_OF_DAY_DESCRIPTIONS[settings.timeOfDay]);
  }

  // Add season (if selected)
  if (settings.season && SEASON_DESCRIPTIONS[settings.season]) {
    enhancements.push(SEASON_DESCRIPTIONS[settings.season]);
  }

  // Add weather (if selected)
  if (settings.weather && WEATHER_DESCRIPTIONS[settings.weather]) {
    enhancements.push(WEATHER_DESCRIPTIONS[settings.weather]);
  }

  // Add quality level (if selected)
  if (settings.quality && QUALITY_DESCRIPTIONS[settings.quality]) {
    enhancements.push(QUALITY_DESCRIPTIONS[settings.quality]);
  }

  // Combine prompt with enhancements
  if (enhancements.length > 0) {
    prompt = `${prompt}, ${enhancements.join(", ")}`;
  }

  return prompt;
}

/**
 * Validates render settings
 *
 * @param settings - Render settings to validate
 * @returns Validation result with any error messages
 */
export function validateRenderSettings(settings: RenderSettingsType): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate design style
  if (settings.designStyle && !DESIGN_STYLE_DESCRIPTIONS[settings.designStyle]) {
    errors.push(`Invalid design style: ${settings.designStyle}`);
  }

  // Validate render style
  if (settings.renderStyle && !RENDER_STYLE_DESCRIPTIONS[settings.renderStyle]) {
    errors.push(`Invalid render style: ${settings.renderStyle}`);
  }

  // Validate time of day
  if (settings.timeOfDay && !TIME_OF_DAY_DESCRIPTIONS[settings.timeOfDay]) {
    errors.push(`Invalid time of day: ${settings.timeOfDay}`);
  }

  // Validate season
  if (settings.season && !SEASON_DESCRIPTIONS[settings.season]) {
    errors.push(`Invalid season: ${settings.season}`);
  }

  // Validate weather
  if (settings.weather && !WEATHER_DESCRIPTIONS[settings.weather]) {
    errors.push(`Invalid weather: ${settings.weather}`);
  }

  // Validate quality
  if (settings.quality && !QUALITY_DESCRIPTIONS[settings.quality]) {
    errors.push(`Invalid quality: ${settings.quality}`);
  }

  // Validate space type
  if (settings.spaceType && !SPACE_TYPE_DESCRIPTIONS[settings.spaceType]) {
    errors.push(`Invalid space type: ${settings.spaceType}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
