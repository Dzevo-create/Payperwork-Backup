/**
 * Branding Settings Type Definitions
 *
 * Defines all configuration options for the Branding workflow.
 * All fields are optional (nullable) to allow gradual refinement through the workflow.
 */

/**
 * Main branding settings interface
 * All fields are optional and nullable for flexible configuration
 */
export interface BrandingSettingsType {
  /** Space type: interior or exterior */
  spaceType?: "interior" | "exterior" | null;

  /** Image aspect ratio */
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | null;

  /**
   * Venue Type - Type of venue/location for branding
   * Defines the context where branding will be applied
   */
  venueType?:
    | "retail"
    | "concert"
    | "event"
    | "wedding"
    | "restaurant"
    | "hotel"
    | "office"
    | "exhibition"
    | "club"
    | "festival"
    | null;

  /**
   * Branding Text - Custom text/brand name to apply
   * Free-form text input for branding customization
   */
  brandingText?: string | null;

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

  /** Render quality level */
  quality?: "ultra" | "high" | "standard" | null;

  /** Structure Fidelity - How strictly to preserve source image structure (0-100%) */
  structureFidelity?: number | null;

  /** Preserve Empty Space - If true, keep empty/minimal spaces; if false, allow AI to fill spaces with details */
  preserveEmptySpace?: boolean | null;

  /** Index signature to allow Record<string, unknown> compatibility */
  [key: string]: unknown;
}

/**
 * Default branding settings with all fields set to null
 * Use as starting point for new branding configurations
 */
export const DEFAULT_BRANDING_SETTINGS: BrandingSettingsType = {
  spaceType: null,
  aspectRatio: null,
  venueType: null,
  brandingText: null,
  renderStyle: null,
  timeOfDay: null,
  quality: null,
  structureFidelity: 100, // Default: exact structure preservation
  preserveEmptySpace: false, // Default: allow AI to fill empty spaces
};

/**
 * Option arrays for dropdown components
 */
export const SPACE_TYPE_OPTIONS = ["interior", "exterior"] as const;

export const ASPECT_RATIO_OPTIONS = ["16:9", "9:16", "1:1", "4:3"] as const;

export const VENUE_TYPE_OPTIONS = [
  "retail",
  "concert",
  "event",
  "wedding",
  "restaurant",
  "hotel",
  "office",
  "exhibition",
  "club",
  "festival",
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

export const QUALITY_OPTIONS = ["ultra", "high", "standard"] as const;

/**
 * Label mappings for UI display
 * Maps internal values to user-friendly labels
 */
export const BRANDING_SETTINGS_LABELS: Record<string, Record<string, string>> = {
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
  venueType: {
    retail: "Einzelhandel",
    concert: "Konzert",
    event: "Event",
    wedding: "Hochzeit",
    restaurant: "Restaurant",
    hotel: "Hotel",
    office: "Büro",
    exhibition: "Ausstellung",
    club: "Club",
    festival: "Festival",
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
  quality: {
    ultra: "Ultra Quality",
    high: "High Quality",
    standard: "Standard Quality",
  },
};

/**
 * Preset Configurations with Default Values
 * Each preset provides sensible defaults for all branding settings
 */
export const PRESET_CONFIGURATIONS: Record<string, BrandingSettingsType> = {
  retail: {
    spaceType: "interior",
    aspectRatio: "16:9",
    venueType: "retail",
    brandingText: null,
    renderStyle: "photorealistic",
    timeOfDay: "midday",
    quality: "ultra",
    preserveEmptySpace: false,
  },
  event: {
    spaceType: "interior",
    aspectRatio: "16:9",
    venueType: "event",
    brandingText: null,
    renderStyle: "hyperrealistic",
    timeOfDay: "evening",
    quality: "high",
    preserveEmptySpace: false,
  },
  outdoor: {
    spaceType: "exterior",
    aspectRatio: "16:9",
    venueType: "festival",
    brandingText: null,
    renderStyle: "photorealistic",
    timeOfDay: "afternoon",
    quality: "high",
    preserveEmptySpace: false,
  },
  hochzeit: {
    spaceType: "interior",
    aspectRatio: "16:9",
    venueType: "wedding",
    brandingText: null,
    renderStyle: "hyperrealistic",
    timeOfDay: "evening",
    quality: "ultra",
    preserveEmptySpace: false,
  },
  none: {
    spaceType: null,
    aspectRatio: null,
    venueType: null,
    brandingText: null,
    renderStyle: null,
    timeOfDay: null,
    quality: null,
    preserveEmptySpace: false,
  },
};

/**
 * Type guards for runtime validation
 */
export const isValidSpaceType = (
  value: unknown
): value is NonNullable<BrandingSettingsType["spaceType"]> => {
  return SPACE_TYPE_OPTIONS.includes(value as any);
};

export const isValidVenueType = (
  value: unknown
): value is NonNullable<BrandingSettingsType["venueType"]> => {
  return VENUE_TYPE_OPTIONS.includes(value as any);
};

export const isValidRenderStyle = (
  value: unknown
): value is NonNullable<BrandingSettingsType["renderStyle"]> => {
  return RENDER_STYLE_OPTIONS.includes(value as any);
};
