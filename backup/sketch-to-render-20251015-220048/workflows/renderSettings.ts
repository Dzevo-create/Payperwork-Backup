/**
 * Render Settings Type Definitions
 *
 * Defines all configuration options for the Sketch-to-Render workflow.
 * All fields are optional (nullable) to allow gradual refinement through the workflow.
 */

/**
 * Main render settings interface
 * All fields are optional and nullable for flexible configuration
 */
export interface RenderSettingsType {
  /** Space type: interior or exterior */
  spaceType?: "interior" | "exterior" | null;

  /** Image aspect ratio */
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | null;

  /**
   * Design Style - Architectural/interior design styles
   * Defines the aesthetic and architectural approach
   */
  designStyle?:
    | "modern"
    | "minimalist"
    | "mediterranean"
    | "scandinavian"
    | "industrial"
    | "classical"
    | "contemporary"
    | "rustic"
    | "bauhaus"
    | "art-deco"
    | "japanese"
    | "tropical"
    | "brutalist"
    | null;

  /**
   * Render Style - Rendering quality and technique
   * Defines how the final image should be rendered
   */
  renderStyle?:
    | "hyperrealistic"
    | "photorealistic"
    | "3d-render"
    | "architectural-visualization"
    | "concept-art"
    | null;

  /** Time of day for lighting */
  timeOfDay?: "morning" | "midday" | "afternoon" | "evening" | "night" | null;

  /** Season for environmental context */
  season?: "spring" | "summer" | "autumn" | "winter" | null;

  /** Weather conditions */
  weather?: "sunny" | "cloudy" | "rainy" | "foggy" | null;

  /** Render quality level */
  quality?: "ultra" | "high" | "standard" | null;
}

/**
 * Default render settings with all fields set to null
 * Use as starting point for new render configurations
 */
export const DEFAULT_RENDER_SETTINGS: RenderSettingsType = {
  spaceType: null,
  aspectRatio: null,
  designStyle: null,
  renderStyle: null,
  timeOfDay: null,
  season: null,
  weather: null,
  quality: null,
};

/**
 * Option arrays for dropdown components
 */
export const SPACE_TYPE_OPTIONS = ["interior", "exterior"] as const;

export const ASPECT_RATIO_OPTIONS = ["16:9", "9:16", "1:1", "4:3"] as const;

export const DESIGN_STYLE_OPTIONS = [
  "modern",
  "minimalist",
  "mediterranean",
  "scandinavian",
  "industrial",
  "classical",
  "contemporary",
  "rustic",
  "bauhaus",
  "art-deco",
  "japanese",
  "tropical",
  "brutalist",
] as const;

export const RENDER_STYLE_OPTIONS = [
  "hyperrealistic",
  "photorealistic",
  "3d-render",
  "architectural-visualization",
  "concept-art",
] as const;

export const TIME_OF_DAY_OPTIONS = [
  "morning",
  "midday",
  "afternoon",
  "evening",
  "night",
] as const;

export const SEASON_OPTIONS = ["spring", "summer", "autumn", "winter"] as const;

export const WEATHER_OPTIONS = ["sunny", "cloudy", "rainy", "foggy"] as const;

export const QUALITY_OPTIONS = ["ultra", "high", "standard"] as const;

/**
 * Label mappings for UI display
 * Maps internal values to user-friendly labels
 */
export const RENDER_SETTINGS_LABELS: Record<string, Record<string, string>> = {
  spaceType: {
    interior: "Interior",
    exterior: "Exterior",
  },
  aspectRatio: {
    "16:9": "16:9 (Landscape)",
    "9:16": "9:16 (Portrait)",
    "1:1": "1:1 (Square)",
    "4:3": "4:3 (Classic)",
  },
  designStyle: {
    modern: "Modern",
    minimalist: "Minimalist",
    mediterranean: "Mediterranean",
    scandinavian: "Scandinavian",
    industrial: "Industrial",
    classical: "Classical",
    contemporary: "Contemporary",
    rustic: "Rustic",
    bauhaus: "Bauhaus",
    "art-deco": "Art Deco",
    japanese: "Japanese",
    tropical: "Tropical",
    brutalist: "Brutalist",
  },
  renderStyle: {
    hyperrealistic: "Hyperrealistic",
    photorealistic: "Photorealistic",
    "3d-render": "3D Render",
    "architectural-visualization": "Architectural Visualization",
    "concept-art": "Concept Art",
  },
  timeOfDay: {
    morning: "Morning",
    midday: "Midday",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night",
  },
  season: {
    spring: "Spring",
    summer: "Summer",
    autumn: "Autumn",
    winter: "Winter",
  },
  weather: {
    sunny: "Sunny",
    cloudy: "Cloudy",
    rainy: "Rainy",
    foggy: "Foggy",
  },
  quality: {
    ultra: "Ultra Quality",
    high: "High Quality",
    standard: "Standard Quality",
  },
};

/**
 * Preset Configurations with Default Values
 * Each preset provides sensible defaults for all render settings
 */
export const PRESET_CONFIGURATIONS: Record<string, RenderSettingsType> = {
  architektur: {
    spaceType: null,
    aspectRatio: "16:9",
    designStyle: "contemporary",
    renderStyle: "architectural-visualization",
    timeOfDay: "midday",
    season: "summer",
    weather: "sunny",
    quality: "ultra",
  },
  interior: {
    spaceType: "interior",
    aspectRatio: "16:9",
    designStyle: "modern",
    renderStyle: "photorealistic",
    timeOfDay: "midday",
    season: null,
    weather: null,
    quality: "high",
  },
  exterior: {
    spaceType: "exterior",
    aspectRatio: "16:9",
    designStyle: "contemporary",
    renderStyle: "photorealistic",
    timeOfDay: "afternoon",
    season: "summer",
    weather: "sunny",
    quality: "high",
  },
  modern: {
    spaceType: null,
    aspectRatio: "16:9",
    designStyle: "modern",
    renderStyle: "hyperrealistic",
    timeOfDay: "midday",
    season: "summer",
    weather: "sunny",
    quality: "ultra",
  },
  classical: {
    spaceType: null,
    aspectRatio: "4:3",
    designStyle: "classical",
    renderStyle: "architectural-visualization",
    timeOfDay: "afternoon",
    season: "autumn",
    weather: "cloudy",
    quality: "high",
  },
  minimalist: {
    spaceType: null,
    aspectRatio: "16:9",
    designStyle: "minimalist",
    renderStyle: "hyperrealistic",
    timeOfDay: "morning",
    season: "spring",
    weather: "sunny",
    quality: "ultra",
  },
  none: {
    spaceType: null,
    aspectRatio: null,
    designStyle: null,
    renderStyle: null,
    timeOfDay: null,
    season: null,
    weather: null,
    quality: null,
  },
};

/**
 * Type guards for runtime validation
 */
export const isValidSpaceType = (
  value: unknown
): value is NonNullable<RenderSettingsType["spaceType"]> => {
  return SPACE_TYPE_OPTIONS.includes(value as any);
};

export const isValidDesignStyle = (
  value: unknown
): value is NonNullable<RenderSettingsType["designStyle"]> => {
  return DESIGN_STYLE_OPTIONS.includes(value as any);
};

export const isValidRenderStyle = (
  value: unknown
): value is NonNullable<RenderSettingsType["renderStyle"]> => {
  return RENDER_STYLE_OPTIONS.includes(value as any);
};
