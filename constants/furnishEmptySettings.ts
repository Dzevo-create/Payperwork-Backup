// constants/furnishEmptySettings.ts
import { Home, Bed, UtensilsCrossed, Briefcase, Bath, Baby, DoorOpen, Wind, Palette, Sparkles, Sofa, Sun, Users as UsersIcon, Package, Grid3x3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Space Types
export const SPACE_TYPES = [
  { value: "living_room", label: "Wohnzimmer" },
  { value: "bedroom", label: "Schlafzimmer" },
  { value: "kitchen", label: "Küche" },
  { value: "dining_room", label: "Esszimmer" },
  { value: "office", label: "Arbeitszimmer" },
  { value: "bathroom", label: "Badezimmer" },
  { value: "kids_room", label: "Kinderzimmer" },
  { value: "guest_room", label: "Gästezimmer" },
  { value: "hallway", label: "Flur" },
  { value: "balcony", label: "Balkon" },
  { value: "terrace", label: "Terrasse" },
];

// Furnishing Styles
export const FURNISHING_STYLES = [
  { value: "modern", label: "Modern" },
  { value: "scandinavian", label: "Skandinavisch" },
  { value: "minimalist", label: "Minimalistisch" },
  { value: "industrial", label: "Industrial" },
  { value: "boho", label: "Boho" },
  { value: "farmhouse", label: "Landhaus" },
  { value: "mid_century", label: "Mid-Century" },
  { value: "classic", label: "Klassisch" },
  { value: "luxury", label: "Luxuriös" },
  { value: "japandi", label: "Japandi" },
  { value: "coastal", label: "Coastal" },
  { value: "rustic", label: "Rustikal" },
];

// Color Schemes
export const COLOR_SCHEMES = [
  { value: "neutral", label: "Neutral" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Kalt" },
  { value: "monochrome", label: "Monochrom" },
  { value: "natural", label: "Natürlich" },
  { value: "colorful", label: "Bunt" },
  { value: "dark", label: "Dunkel" },
  { value: "light", label: "Hell" },
  { value: "organic", label: "Organisch" },
  { value: "earthy", label: "Erdisch" },
  { value: "pastel", label: "Pastell" },
  { value: "bold", label: "Kräftig" },
];

// Furniture Density
export const FURNITURE_DENSITIES = [
  { value: "minimal", label: "Minimalistisch" },
  { value: "normal", label: "Normal" },
  { value: "full", label: "Voll eingerichtet" },
  { value: "luxury", label: "Luxuriös" },
];

// Lighting
export const LIGHTINGS = [
  { value: "natural_daylight", label: "Tageslicht" },
  { value: "warm_evening", label: "Abendlicht" },
  { value: "bright_artificial", label: "Kunstlicht" },
  { value: "cozy", label: "Gemütlich" },
  { value: "dramatic", label: "Dramatisch" },
];

// Target Audiences
export const TARGET_AUDIENCES = [
  { value: "family", label: "Familie" },
  { value: "single", label: "Singles" },
  { value: "couple", label: "Paare" },
  { value: "seniors", label: "Senioren" },
  { value: "students", label: "Studenten" },
  { value: "luxury_buyers", label: "Luxus-Käufer" },
  { value: "first_time_renters", label: "Erstmieter" },
];

// Materials (Multi-select)
export const MATERIALS = [
  { value: "wood", label: "Holz" },
  { value: "metal", label: "Metall" },
  { value: "glass", label: "Glas" },
  { value: "stone", label: "Stein" },
  { value: "fabric", label: "Stoff" },
  { value: "leather", label: "Leder" },
  { value: "concrete", label: "Beton" },
  { value: "marble", label: "Marmor" },
  { value: "ceramic", label: "Keramik" },
  { value: "rattan", label: "Rattan" },
  { value: "velvet", label: "Samt" },
  { value: "linen", label: "Leinen" },
];

// Icons for Space Types
export function getSpaceTypeIcon(spaceType: string | null): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    living_room: Home,
    bedroom: Bed,
    kitchen: UtensilsCrossed,
    dining_room: UtensilsCrossed,
    office: Briefcase,
    bathroom: Bath,
    kids_room: Baby,
    guest_room: Bed,
    hallway: DoorOpen,
    balcony: Wind,
    terrace: Wind,
  };
  return iconMap[spaceType || "living_room"] || Home;
}

// Icons for Settings
export const SETTING_ICONS = {
  spaceType: Home,
  furnishingStyle: Palette,
  colorScheme: Sparkles,
  furnitureDensity: Sofa,
  lighting: Sun,
  targetAudience: UsersIcon,
  materials: Package,
  structureAdherence: Grid3x3,
};

// Get Setting Label
export function getSettingLabel(key: string, value: string | null): string {
  if (!value) return "Auswählen";

  const labelMaps: Record<string, Record<string, string>> = {
    spaceType: Object.fromEntries(SPACE_TYPES.map(s => [s.value, s.label])),
    furnishingStyle: Object.fromEntries(FURNISHING_STYLES.map(s => [s.value, s.label])),
    colorScheme: Object.fromEntries(COLOR_SCHEMES.map(s => [s.value, s.label])),
    furnitureDensity: Object.fromEntries(FURNITURE_DENSITIES.map(s => [s.value, s.label])),
    lighting: Object.fromEntries(LIGHTINGS.map(s => [s.value, s.label])),
    targetAudience: Object.fromEntries(TARGET_AUDIENCES.map(s => [s.value, s.label])),
  };

  return labelMaps[key]?.[value] || value;
}
