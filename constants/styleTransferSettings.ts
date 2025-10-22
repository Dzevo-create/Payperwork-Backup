/**
 * Style Transfer Settings Constants
 *
 * Definiert alle verfügbaren Optionen für das Style Transfer System
 */

import {
  StyleTransferMode,
  SpaceType,
  ArchitecturalStyle,
  TimeOfDay,
  Weather,
  RenderStyle,
} from "@/types/workflows/styleTransferSettings";

// =============================================================================
// MODE OPTIONS
// =============================================================================

export const MODES: Array<{ value: StyleTransferMode; label: string }> = [
  { value: "preset", label: "Preset" },
  { value: "reference", label: "Referenzbild" },
];

// =============================================================================
// SPACE TYPE OPTIONS
// =============================================================================

export const SPACE_TYPES: Array<{ value: SpaceType; label: string }> = [
  { value: "interieur", label: "Interieur" },
  { value: "exterieur", label: "Exterieur" },
];

// =============================================================================
// ARCHITECTURAL STYLE OPTIONS
// =============================================================================

export const ARCHITECTURAL_STYLES: Array<{ value: ArchitecturalStyle; label: string }> = [
  { value: "mediterran", label: "Mediterran" },
  { value: "ikea", label: "IKEA / Skandinavisch" },
  { value: "minimalistisch", label: "Minimalistisch" },
  { value: "modern", label: "Modern" },
  { value: "mittelalterlich", label: "Mittelalterlich" },
  { value: "industrial", label: "Industrial" },
];

// =============================================================================
// TIME OF DAY OPTIONS
// =============================================================================

export const TIME_OF_DAY: Array<{ value: TimeOfDay; label: string }> = [
  { value: "morgen", label: "Morgen" },
  { value: "mittag", label: "Mittag" },
  { value: "abend", label: "Abend" },
  { value: "nacht", label: "Nacht" },
  { value: "daemmerung", label: "Dämmerung" },
  { value: "golden_hour", label: "Golden Hour" },
];

// =============================================================================
// WEATHER OPTIONS
// =============================================================================

export const WEATHER: Array<{ value: Weather; label: string }> = [
  { value: "sonnig", label: "Sonnig" },
  { value: "bewoelkt", label: "Bewölkt" },
  { value: "regen", label: "Regen" },
  { value: "schnee", label: "Schnee" },
  { value: "nebel", label: "Nebel" },
  { value: "sturm", label: "Sturm" },
];

// =============================================================================
// RENDER STYLE OPTIONS
// =============================================================================

export const RENDER_STYLES: Array<{ value: RenderStyle; label: string }> = [
  { value: "fotorealistisch", label: "Fotorealistisch" },
  { value: "skizze", label: "Skizze" },
  { value: "wasserfarben", label: "Wasserfarben" },
  { value: "blaupause", label: "Blaupause" },
  { value: "kuenstlerisch", label: "Künstlerisch" },
];

// =============================================================================
// ICON MAPPING (für UI-Darstellung)
// =============================================================================

export const SETTING_ICONS = {
  mode: "LayoutGrid",
  spaceType: "Building",
  architecturalStyle: "Palette",
  timeOfDay: "Clock",
  weather: "Cloud",
  renderStyle: "Paintbrush",
  structurePreservation: "Lock",
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Holt das Label für einen gegebenen Wert
 */
export function getLabel<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: T
): string {
  return options.find((opt) => opt.value === value)?.label || value;
}

/**
 * Validiert ob ein Wert in den verfügbaren Optionen existiert
 */
export function isValidOption<T extends string>(
  options: Array<{ value: T; label: string }>,
  value: string
): value is T {
  return options.some((opt) => opt.value === value);
}
