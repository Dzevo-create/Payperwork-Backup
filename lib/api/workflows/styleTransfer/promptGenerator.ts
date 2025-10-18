/**
 * Style-Transfer Prompt Generator
 *
 * Generates detailed prompts for style transfer based on settings and user input.
 * Creates flowing text descriptions for AI image generation.
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
    transferMode,
    styleStrength,
    structurePreservation,
    materialTransfer,
    colorTransfer,
    detailLevel,
    architecturalElements,
  } = settings;

  // Transfer Mode descriptions
  const modeDescriptions: Record<string, string> = {
    subtle:
      "Subtly transfer the style while maintaining most of the original design characteristics",
    balanced:
      "Transfer the style in a balanced way, preserving key design elements while introducing new stylistic features",
    strong:
      "Strongly transfer the style, allowing significant design changes and comprehensive style adoption",
  };

  // Material Transfer descriptions
  const materialDescriptions: Record<string, string> = {
    none: "Keep all original materials unchanged, preserving the existing material palette",
    partial:
      "Transfer main materials only, focusing on primary surfaces like facades and roofs",
    full: "Transfer all materials from the reference style, including textures, finishes, and material properties",
    selective:
      "Selectively transfer specific materials that enhance the design while maintaining original material choices where appropriate",
  };

  // Color Transfer descriptions
  const colorDescriptions: Record<string, string> = {
    none: "Preserve the original color scheme entirely without modifications",
    palette:
      "Adopt the color palette from the reference style while maintaining original color distribution",
    full: "Transfer all colors from the reference style, including primary, secondary, and accent colors",
    harmonized:
      "Transfer colors from reference style but harmonize them with the original design for cohesive integration",
  };

  // Detail Level descriptions
  const detailDescriptions: Record<string, string> = {
    low: "Transfer broad style elements and general aesthetic characteristics",
    medium:
      "Transfer style with moderate detail, including key ornamental and textural features",
    high: "Transfer style with high detail preservation, capturing intricate design elements and fine textures",
    very_high:
      "Transfer style with maximum detail fidelity, replicating even subtle stylistic nuances and micro-details",
  };

  // Architectural element labels
  const elementLabels: Record<string, string> = {
    facade: "facade design and composition",
    windows: "window styles, frames, and proportions",
    doors: "door designs, frames, and hardware",
    roof: "roof structure, materials, and details",
    columns: "column styles, capitals, and bases",
    ornaments: "ornamental details and decorative elements",
    textures: "surface textures and material finishes",
    lighting: "lighting effects and atmospheric qualities",
  };

  // Build flowing text prompt
  let prompt = `Transform the source design by transferring the architectural style from the reference image. `;

  prompt += `Apply a ${transferMode} transfer approach: ${modeDescriptions[transferMode]}. `;

  prompt += `The style transfer should operate at ${styleStrength}% strength, creating a ${styleStrength < 40 ? "subtle" : styleStrength < 70 ? "moderate" : "strong"} stylistic transformation. `;

  prompt += `Preserve ${structurePreservation}% of the original structure and layout, ensuring ${structurePreservation < 40 ? "significant flexibility" : structurePreservation < 70 ? "balanced preservation" : "strict adherence"} to the original composition. `;

  prompt += `Regarding materials: ${materialDescriptions[materialTransfer]}. `;

  prompt += `For color treatment: ${colorDescriptions[colorTransfer]}. `;

  prompt += `Apply ${detailLevel} detail level: ${detailDescriptions[detailLevel]}. `;

  // Handle architectural elements
  if (architecturalElements && architecturalElements.length > 0) {
    const elementsList = architecturalElements
      .map((e) => elementLabels[e])
      .join(", ");
    prompt += `Focus specifically on transferring these architectural elements: ${elementsList}. `;
  } else {
    prompt += `Transfer all architectural elements comprehensively, including facade, windows, doors, roof, ornaments, textures, and lighting. `;
  }

  // Critical requirements
  prompt += `\n\nCritical Requirements:\n`;
  prompt += `- Analyze the reference image thoroughly for style characteristics, materials, colors, proportions, and architectural details\n`;
  prompt += `- Apply the identified style elements to the source design while respecting the specified preservation level\n`;
  prompt += `- Maintain architectural coherence and structural integrity throughout the transformation\n`;
  prompt += `- Ensure realistic integration of style elements with proper scale, proportion, and context\n`;
  prompt += `- Create a seamless blend between source design and reference style without jarring discontinuities\n`;
  prompt += `- Preserve photorealistic quality with accurate lighting, shadows, and material properties\n`;
  prompt += `- Maintain the overall composition and spatial arrangement of the source design\n`;
  prompt += `- Ensure all transferred elements are contextually appropriate and architecturally sound\n\n`;

  prompt += `The final result should appear as a professional architectural rendering that successfully combines the source design's composition with the reference style's aesthetic qualities, creating a cohesive and believable architectural visualization.`;

  // Append user prompt if provided
  if (userPrompt && userPrompt.trim()) {
    prompt += `\n\nAdditional Requirements: ${userPrompt.trim()}`;
  }

  return prompt;
}
