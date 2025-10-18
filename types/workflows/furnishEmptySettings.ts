// types/workflows/furnishEmptySettings.ts
export type SpaceType =
  | "living_room"
  | "bedroom"
  | "kitchen"
  | "dining_room"
  | "office"
  | "bathroom"
  | "kids_room"
  | "guest_room"
  | "hallway"
  | "balcony"
  | "terrace";

export type FurnishingStyle =
  | "modern"
  | "scandinavian"
  | "minimalist"
  | "industrial"
  | "boho"
  | "farmhouse"
  | "mid_century"
  | "classic"
  | "luxury"
  | "japandi"
  | "coastal"
  | "rustic";

export type ColorScheme =
  | "neutral"
  | "warm"
  | "cool"
  | "monochrome"
  | "natural"
  | "colorful"
  | "dark"
  | "light"
  | "organic"
  | "earthy"
  | "pastel"
  | "bold";

export type FurnitureDensity = "minimal" | "normal" | "full" | "luxury";

export type Lighting =
  | "natural_daylight"
  | "warm_evening"
  | "bright_artificial"
  | "cozy"
  | "dramatic";

export type TargetAudience =
  | "family"
  | "single"
  | "couple"
  | "seniors"
  | "students"
  | "luxury_buyers"
  | "first_time_renters";

export type Material =
  | "wood"
  | "metal"
  | "glass"
  | "stone"
  | "fabric"
  | "leather"
  | "concrete"
  | "marble"
  | "ceramic"
  | "rattan"
  | "velvet"
  | "linen";

export interface FurnishEmptySettingsType extends Record<string, unknown> {
  spaceType: SpaceType;
  furnishingStyle: FurnishingStyle;
  colorScheme: ColorScheme;
  furnitureDensity: FurnitureDensity;
  lighting: Lighting;
  targetAudience: TargetAudience;
  materials: Material[]; // Multi-select
  structureAdherence: number; // 0-100% wie bei Branding
}

export const DEFAULT_FURNISH_EMPTY_SETTINGS: FurnishEmptySettingsType = {
  spaceType: "living_room",
  furnishingStyle: "modern",
  colorScheme: "neutral",
  furnitureDensity: "normal",
  lighting: "natural_daylight",
  targetAudience: "family",
  materials: [],
  structureAdherence: 100,
};
