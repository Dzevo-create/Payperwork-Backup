/**
 * Structure Fidelity Configuration
 *
 * Controls how strictly the AI should preserve the structure of the source image.
 * - 100% = Exact camera angle, perfect layout preservation
 * - 80% = Same structure but with more creative freedom
 * - 60% = General layout preserved, more interpretation
 * - 40% = Loose interpretation, major changes allowed
 * - 20% = Only inspiration, creative freedom
 */

export type StructureFidelityValue = number; // 0-100

/**
 * Structure Fidelity Presets
 *
 * Predefined fidelity levels with descriptions
 */
export const STRUCTURE_FIDELITY_PRESETS = [
  {
    value: 100,
    label: "Exact Structure",
    description: "Perfect preservation - same camera angle, layout, proportions",
    promptModifier: "CRITICAL: Use the EXACT camera angle, perspective, viewpoint from source. EXACT same layout, proportions, composition, framing."
  },
  {
    value: 90,
    label: "Very High",
    description: "Minimal variation - nearly identical structure",
    promptModifier: "Preserve the camera angle, perspective, and overall layout from source with minimal variation."
  },
  {
    value: 80,
    label: "High",
    description: "Same structure with creative freedom",
    promptModifier: "Maintain the general camera angle and layout from source, but allow some creative interpretation."
  },
  {
    value: 70,
    label: "Medium-High",
    description: "General structure preserved, more creativity",
    promptModifier: "Keep the general structure and composition similar to source, with moderate creative freedom."
  },
  {
    value: 60,
    label: "Medium",
    description: "Layout guidance, significant freedom",
    promptModifier: "Use the source as layout guidance, allowing significant creative interpretation."
  },
  {
    value: 50,
    label: "Balanced",
    description: "Equal parts preservation and creativity",
    promptModifier: "Balance between source layout and creative freedom - use source as inspiration."
  },
  {
    value: 40,
    label: "Low-Medium",
    description: "Loose interpretation, major changes OK",
    promptModifier: "Loosely interpret the source layout - major compositional changes allowed."
  },
  {
    value: 30,
    label: "Low",
    description: "Inspiration only, high creativity",
    promptModifier: "Use source as general inspiration - high creative freedom for composition."
  },
  {
    value: 20,
    label: "Very Low",
    description: "Minimal influence, maximum creativity",
    promptModifier: "Source provides minimal influence - maximum creative freedom."
  },
  {
    value: 10,
    label: "Inspiration",
    description: "Only thematic inspiration from source",
    promptModifier: "Source provides only thematic inspiration - complete creative freedom."
  },
] as const;

/**
 * Default Structure Fidelity
 */
export const DEFAULT_STRUCTURE_FIDELITY = 100;

/**
 * Get Prompt Modifier for Structure Fidelity
 *
 * Returns the appropriate prompt instruction based on fidelity level
 */
export function getStructureFidelityPromptModifier(fidelity: number): string {
  // Find closest preset
  const preset = STRUCTURE_FIDELITY_PRESETS.reduce((closest, current) => {
    return Math.abs(current.value - fidelity) < Math.abs(closest.value - fidelity)
      ? current
      : closest;
  });

  return preset.promptModifier;
}

/**
 * Get Structure Fidelity Label
 *
 * Returns the label for display in UI
 */
export function getStructureFidelityLabel(fidelity: number): string {
  const preset = STRUCTURE_FIDELITY_PRESETS.reduce((closest, current) => {
    return Math.abs(current.value - fidelity) < Math.abs(closest.value - fidelity)
      ? current
      : closest;
  });

  return preset.label;
}

/**
 * Get Structure Fidelity Description
 *
 * Returns the description for tooltips
 */
export function getStructureFidelityDescription(fidelity: number): string {
  const preset = STRUCTURE_FIDELITY_PRESETS.reduce((closest, current) => {
    return Math.abs(current.value - fidelity) < Math.abs(closest.value - fidelity)
      ? current
      : closest;
  });

  return preset.description;
}
