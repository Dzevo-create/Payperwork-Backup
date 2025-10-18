/**
 * Style-Transfer Workflow Constants
 *
 * All dropdown options, labels, and icons for the Style-Transfer workflow settings.
 */

import { Building2, Zap, Sparkles, Grid3x3, Package, Palette, Droplet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ============================================================================
// ARCHITECTURAL STYLES
// ============================================================================

export const ARCHITECTURAL_STYLES = [
  { value: "modern", label: "Modern" },
  { value: "contemporary", label: "Zeitgenössisch" },
  { value: "minimalist", label: "Minimalistisch" },
  { value: "industrial", label: "Industrial" },
  { value: "mediterranean", label: "Mediterran" },
  { value: "scandinavian", label: "Skandinavisch" },
  { value: "classical", label: "Klassisch" },
  { value: "baroque", label: "Barock" },
  { value: "art_deco", label: "Art Déco" },
  { value: "brutalist", label: "Brutalistisch" },
  { value: "gothic", label: "Gotisch" },
  { value: "renaissance", label: "Renaissance" },
] as const;

// ============================================================================
// TRANSFER INTENSITY
// ============================================================================

export const TRANSFER_INTENSITIES = [
  { value: "subtle", label: "Subtil" },
  { value: "balanced", label: "Ausgewogen" },
  { value: "strong", label: "Stark" },
] as const;

// ============================================================================
// MATERIAL PALETTES
// ============================================================================

export const MATERIAL_PALETTES = [
  { value: "natural", label: "Natürlich (Holz, Stein)" },
  { value: "industrial", label: "Industrial (Metall, Beton)" },
  { value: "luxury", label: "Luxuriös (Marmor, Gold)" },
  { value: "rustic", label: "Rustikal (Holz, Ziegel)" },
  { value: "modern", label: "Modern (Glas, Stahl)" },
  { value: "traditional", label: "Traditionell (Stein, Holz)" },
  { value: "mixed", label: "Gemischt" },
] as const;

// ============================================================================
// COLOR SCHEMES
// ============================================================================

export const COLOR_SCHEMES = [
  { value: "neutral", label: "Neutral (Weiß, Grau, Beige)" },
  { value: "warm", label: "Warm (Rot, Orange, Gelb)" },
  { value: "cool", label: "Kühl (Blau, Grün, Violett)" },
  { value: "monochrome", label: "Monochrom (Eine Farbe)" },
  { value: "vibrant", label: "Lebendig (Kräftige Farben)" },
  { value: "pastel", label: "Pastell (Zarte Farben)" },
  { value: "earth_tones", label: "Erdtöne (Braun, Terrakotta)" },
  { value: "jewel_tones", label: "Juwelentöne (Smaragd, Rubin)" },
  { value: "black_white", label: "Schwarz-Weiß" },
  { value: "gold_accent", label: "Gold-Akzente" },
] as const;

// ============================================================================
// ACCENT COLORS
// ============================================================================

export const ACCENT_COLORS = [
  { value: "red", label: "Rot" },
  { value: "blue", label: "Blau" },
  { value: "green", label: "Grün" },
  { value: "yellow", label: "Gelb" },
  { value: "orange", label: "Orange" },
  { value: "purple", label: "Lila" },
  { value: "pink", label: "Rosa" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silber" },
  { value: "bronze", label: "Bronze" },
  { value: "white", label: "Weiß" },
  { value: "black", label: "Schwarz" },
] as const;

// ============================================================================
// SETTING ICONS
// ============================================================================

export const SETTING_ICONS: Record<string, LucideIcon> = {
  architecturalStyle: Building2,
  transferIntensity: Zap,
  styleStrength: Sparkles,
  structurePreservation: Grid3x3,
  materialPalette: Package,
  colorScheme: Palette,
  accentColor: Droplet,
};

// ============================================================================
// LABEL HELPERS
// ============================================================================

/**
 * Get human-readable label for a setting value
 */
export function getSettingLabel(key: string, value: string | null): string {
  if (!value) return "Auswählen";

  const labelMaps: Record<string, Record<string, string>> = {
    transferIntensity: Object.fromEntries(
      TRANSFER_INTENSITIES.map((s) => [s.value, s.label])
    ),
    materialPalette: Object.fromEntries(
      MATERIAL_PALETTES.map((s) => [s.value, s.label])
    ),
    colorScheme: Object.fromEntries(
      COLOR_SCHEMES.map((s) => [s.value, s.label])
    ),
    accentColor: Object.fromEntries(
      ACCENT_COLORS.map((s) => [s.value, s.label])
    ),
  };

  return labelMaps[key]?.[value] || value;
}
