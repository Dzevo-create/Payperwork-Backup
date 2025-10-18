/**
 * Style-Transfer Prompt Generator
 *
 * Generates detailed prompts for style transfer based on Option 2 settings.
 * Creates flowing text descriptions for AI image generation using:
 * - Architectural Style (preset styles)
 * - Transfer Intensity (subtle/balanced/strong)
 * - Style Strength (0-100%)
 * - Structure Preservation (0-100%)
 * - Material Palette (natural/industrial/luxury/etc)
 * - Color Scheme (neutral/warm/cool/etc)
 * - Accent Color (optional primary color)
 */

import { StyleTransferSettingsType } from "@/types/workflows/styleTransferSettings";

/**
 * Generate a complete style-transfer prompt from settings
 */
export function generateStyleTransferPrompt(
  settings: StyleTransferSettingsType,
  userPrompt?: string
): string {
  const {
    architecturalStyle,
    transferIntensity,
    styleStrength,
    structurePreservation,
    materialPalette,
    colorScheme,
    accentColor,
  } = settings;

  // Architectural Style descriptions
  const styleDescriptions: Record<string, string> = {
    modern: "the clean lines and minimalist aesthetic of Modern architecture, with emphasis on geometric forms, glass facades, and open spaces",
    contemporary: "the Contemporary style with innovative design elements, mixed materials, and bold asymmetrical compositions",
    minimalist: "the Minimalist philosophy of 'less is more', featuring simple forms, neutral palettes, and functional elegance",
    industrial: "the Industrial aesthetic with exposed structures, raw materials like metal and concrete, and utilitarian design",
    mediterranean: "the Mediterranean style with terracotta roofs, stucco walls, arched openings, and warm earthy tones",
    scandinavian: "the Scandinavian design principles of simplicity, natural light, light wood tones, and functional beauty",
    classical: "the Classical architecture with symmetry, columns, pediments, and timeless proportions",
    baroque: "the Baroque grandeur with ornate details, dramatic curves, rich materials, and theatrical flourishes",
    art_deco: "the Art Deco elegance with geometric patterns, streamlined forms, luxurious materials, and bold vertical elements",
    brutalist: "the Brutalist style with raw concrete, massive forms, dramatic sculptural shapes, and honest materiality",
    gothic: "the Gothic architecture with pointed arches, ribbed vaults, flying buttresses, and intricate stone details",
    renaissance: "the Renaissance principles of harmony, proportion, classical orders, and refined ornamentation",
  };

  // Transfer Intensity descriptions
  const intensityDescriptions: Record<string, string> = {
    subtle: "subtly, maintaining most original characteristics while introducing gentle stylistic hints",
    balanced: "in a balanced manner, preserving key design elements while introducing clear stylistic features",
    strong: "strongly, allowing significant transformation and comprehensive style adoption",
  };

  // Material Palette descriptions
  const materialDescriptions: Record<string, string> = {
    natural: "Use natural materials like wood and stone, emphasizing organic textures and earthy warmth",
    industrial: "Use industrial materials like metal and concrete, with raw exposed surfaces and utilitarian finishes",
    luxury: "Use luxury materials like marble and gold, creating an opulent and refined aesthetic",
    rustic: "Use rustic materials like weathered wood and brick, conveying warmth and handcrafted character",
    modern: "Use modern materials like glass and steel, emphasizing sleekness and contemporary sophistication",
    traditional: "Use traditional materials like stone and wood, respecting classic building methods and timeless quality",
    mixed: "Use a mixed material palette, thoughtfully combining different materials for visual interest",
  };

  // Color Scheme descriptions
  const colorDescriptions: Record<string, string> = {
    neutral: "Apply a neutral color scheme with whites, grays, and beiges for timeless elegance",
    warm: "Apply a warm color scheme with reds, oranges, and yellows for inviting energy",
    cool: "Apply a cool color scheme with blues, greens, and violets for calming sophistication",
    monochrome: "Apply a monochrome color scheme focused on one color with tonal variations",
    vibrant: "Apply a vibrant color scheme with bold, saturated colors for dynamic impact",
    pastel: "Apply a pastel color scheme with soft, muted colors for gentle charm",
    earth_tones: "Apply an earth-toned color scheme with browns and terracottas for natural warmth",
    jewel_tones: "Apply a jewel-toned color scheme with rich emeralds and rubies for luxurious depth",
    black_white: "Apply a black and white color scheme for dramatic contrast and timeless simplicity",
    gold_accent: "Apply a color scheme with prominent gold accents for luxurious highlights",
  };

  // Accent Color descriptions
  const accentDescriptions: Record<string, string> = {
    red: "Use red as a strategic accent color to highlight key architectural features",
    blue: "Use blue as a strategic accent color to add calm sophistication to focal points",
    green: "Use green as a strategic accent color to introduce natural freshness",
    yellow: "Use yellow as a strategic accent color to create vibrant focal points",
    orange: "Use orange as a strategic accent color for energetic highlights",
    purple: "Use purple as a strategic accent color for regal elegance",
    pink: "Use pink as a strategic accent color for contemporary softness",
    gold: "Use gold as a strategic accent color for luxurious embellishment",
    silver: "Use silver as a strategic accent color for modern sophistication",
    bronze: "Use bronze as a strategic accent color for warm metallic richness",
    white: "Use white as a strategic accent color for crisp contrast",
    black: "Use black as a strategic accent color for bold definition",
  };

  // Build flowing text prompt
  let prompt = `Transform this architectural sketch into a stunning photorealistic rendering`;

  // Add architectural style if selected
  if (architecturalStyle && styleDescriptions[architecturalStyle]) {
    prompt += ` by embracing ${styleDescriptions[architecturalStyle]}`;
  }

  prompt += `, while maintaining the ${structurePreservation >= 80 ? "precise" : structurePreservation >= 50 ? "general" : "flexible"} composition and perspective of the original illustration. `;

  // Add transfer intensity
  prompt += `Apply the style transformation ${intensityDescriptions[transferIntensity]} `;
  prompt += `with ${styleStrength}% style strength, creating a ${styleStrength < 40 ? "subtle" : styleStrength < 70 ? "moderate" : "pronounced"} stylistic transformation. `;

  // Add material palette if selected
  if (materialPalette && materialDescriptions[materialPalette]) {
    prompt += `${materialDescriptions[materialPalette]} `;
  }

  // Add color scheme if selected
  if (colorScheme && colorDescriptions[colorScheme]) {
    prompt += `${colorDescriptions[colorScheme]} `;
  }

  // Add accent color if selected
  if (accentColor && accentDescriptions[accentColor]) {
    prompt += `${accentDescriptions[accentColor]}, providing striking contrast without overwhelming the overall design. `;
  }

  // Technical requirements
  prompt += `\nIncorporate realistic textures and materials with precision rendering. `;
  prompt += `The lighting should mimic natural daylight, casting soft yet defined shadows that accentuate geometric patterns, creating depth and dimension. `;
  prompt += `Introduce atmospheric details like ${structurePreservation >= 70 ? "subtle" : "expressive"} sky conditions and reflections on surfaces, giving the scene vibrancy and life. `;

  // Preservation requirements
  prompt += `\nEnsure architectural accuracy by ${structurePreservation >= 80 ? "strictly preserving" : structurePreservation >= 50 ? "carefully maintaining" : "flexibly adapting"} the scale and proportions from the sketch. `;
  prompt += `The end result should be a photorealistic rendering that ${structurePreservation >= 70 ? "precisely captures" : "creatively interprets"} the essence of the original drawing while elevating it to professional-quality visualization. `;

  // Append user prompt if provided
  if (userPrompt && userPrompt.trim()) {
    prompt += `\n\nAdditional Requirements: ${userPrompt.trim()}`;
  }

  return prompt;
}
