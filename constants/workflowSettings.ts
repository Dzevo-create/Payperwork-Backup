import { DropdownOption } from "@/components/ui/SettingsDropdown";

/**
 * Shared Workflow Settings Constants
 *
 * Common dropdown options used across multiple workflows:
 * - BrandingSettings
 * - RenderSettings
 * - ImageSettings
 */

// === SPACE & STRUCTURE ===

export const SPACE_TYPES = [
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
] as const satisfies readonly DropdownOption[];

export type SpaceTypeValue = (typeof SPACE_TYPES)[number]["value"];

// === ASPECT RATIOS ===

export const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 Landscape" },
  { value: "9:16", label: "9:16 Portrait" },
  { value: "1:1", label: "1:1 Quadrat" },
  { value: "4:3", label: "4:3 Classic" },
] as const satisfies readonly DropdownOption[];

export type AspectRatioValue = (typeof ASPECT_RATIOS)[number]["value"];

// === VENUE TYPES (Branding Workflow) ===

export const VENUE_TYPES = [
  { value: "retail", label: "Einzelhandel" },
  { value: "concert", label: "Konzert" },
  { value: "event", label: "Event" },
  { value: "wedding", label: "Hochzeit" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "office", label: "Büro" },
  { value: "exhibition", label: "Ausstellung" },
  { value: "club", label: "Club" },
  { value: "festival", label: "Festival" },
  { value: "cafe", label: "Café" },
  { value: "bar", label: "Bar" },
  { value: "gym", label: "Fitnessstudio" },
  { value: "spa", label: "Spa" },
  { value: "shop", label: "Geschäft" },
] as const satisfies readonly DropdownOption[];

export type VenueTypeValue = (typeof VENUE_TYPES)[number]["value"];

// === DESIGN STYLES (Render Workflow) ===

export const DESIGN_STYLES = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Modern Minimalistisch" },
  { value: "mediterranean", label: "Mediterran" },
  { value: "scandinavian", label: "Skandinavisch" },
  { value: "industrial", label: "Industrial" },
  { value: "contemporary", label: "Contemporary" },
  { value: "rustic", label: "Rustikal" },
  { value: "bauhaus", label: "Bauhaus" },
  { value: "art-deco", label: "Art Deco" },
  { value: "japanese", label: "Japanisch" },
  { value: "brutalist", label: "Brutalistisch" },
] as const satisfies readonly DropdownOption[];

export type DesignStyleValue = (typeof DESIGN_STYLES)[number]["value"];

// === RENDER STYLES ===

export const RENDER_STYLES = [
  { value: "hyperrealistic", label: "Hyperrealistisch" },
  { value: "photorealistic", label: "Photorealistisch" },
  { value: "3d-render", label: "3D Render" },
  { value: "architectural-visualization", label: "Architekturvisualisierung" },
  { value: "concept-art", label: "Concept Art" },
] as const satisfies readonly DropdownOption[];

export type RenderStyleValue = (typeof RENDER_STYLES)[number]["value"];

// === TIME & ATMOSPHERE ===

export const TIME_OF_DAY = [
  { value: "morning", label: "Morgens" },
  { value: "midday", label: "Mittags" },
  { value: "afternoon", label: "Nachmittags" },
  { value: "evening", label: "Abends" },
  { value: "night", label: "Nachts" },
] as const satisfies readonly DropdownOption[];

export type TimeOfDayValue = (typeof TIME_OF_DAY)[number]["value"];

export const SEASONS = [
  { value: "spring", label: "Frühling" },
  { value: "summer", label: "Sommer" },
  { value: "autumn", label: "Herbst" },
  { value: "winter", label: "Winter" },
] as const satisfies readonly DropdownOption[];

export type SeasonValue = (typeof SEASONS)[number]["value"];

export const WEATHER = [
  { value: "sunny", label: "Sonnig" },
  { value: "cloudy", label: "Bewölkt" },
  { value: "rainy", label: "Regnerisch" },
  { value: "foggy", label: "Neblig" },
] as const satisfies readonly DropdownOption[];

export type WeatherValue = (typeof WEATHER)[number]["value"];

// === QUALITY ===

export const QUALITY = [
  { value: "ultra", label: "Ultra" },
  { value: "high", label: "High" },
  { value: "standard", label: "Standard" },
] as const satisfies readonly DropdownOption[];

export type QualityValue = (typeof QUALITY)[number]["value"];
