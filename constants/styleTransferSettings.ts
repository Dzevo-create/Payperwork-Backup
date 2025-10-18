/**
 * Style-Transfer Workflow Constants
 *
 * All dropdown options, labels, and icons for the Style-Transfer workflow settings.
 */

import { Shuffle, Palette, Layers, Sparkles, Eye, Grid3x3, Building2 } from "lucide-react";
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
// TRANSFER MODES
// ============================================================================

export const TRANSFER_MODES = [
  { value: "subtle", label: "Subtil" },
  { value: "balanced", label: "Ausgewogen" },
  { value: "strong", label: "Stark" },
] as const;

// ============================================================================
// MATERIAL TRANSFER OPTIONS
// ============================================================================

export const MATERIAL_TRANSFERS = [
  { value: "none", label: "Keine" },
  { value: "partial", label: "Teilweise" },
  { value: "full", label: "Vollständig" },
  { value: "selective", label: "Selektiv" },
] as const;

// ============================================================================
// COLOR TRANSFER OPTIONS
// ============================================================================

export const COLOR_TRANSFERS = [
  { value: "none", label: "Keine" },
  { value: "palette", label: "Farbpalette" },
  { value: "full", label: "Vollständig" },
  { value: "harmonized", label: "Harmonisiert" },
] as const;

// ============================================================================
// DETAIL LEVELS
// ============================================================================

export const DETAIL_LEVELS = [
  { value: "low", label: "Niedrig" },
  { value: "medium", label: "Mittel" },
  { value: "high", label: "Hoch" },
  { value: "very_high", label: "Sehr Hoch" },
] as const;

// ============================================================================
// ARCHITECTURAL ELEMENTS (for multi-select)
// ============================================================================

export const ARCHITECTURAL_ELEMENTS = [
  { value: "facade", label: "Fassade" },
  { value: "windows", label: "Fenster" },
  { value: "doors", label: "Türen" },
  { value: "roof", label: "Dach" },
  { value: "columns", label: "Säulen" },
  { value: "ornaments", label: "Ornamente" },
  { value: "textures", label: "Texturen" },
  { value: "lighting", label: "Beleuchtung" },
] as const;

// ============================================================================
// SETTING ICONS
// ============================================================================

export const SETTING_ICONS: Record<string, LucideIcon> = {
  architecturalStyle: Building2,
  transferMode: Shuffle,
  styleStrength: Sparkles,
  structurePreservation: Grid3x3,
  materialTransfer: Layers,
  colorTransfer: Palette,
  detailLevel: Eye,
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
    transferMode: Object.fromEntries(
      TRANSFER_MODES.map((s) => [s.value, s.label])
    ),
    materialTransfer: Object.fromEntries(
      MATERIAL_TRANSFERS.map((s) => [s.value, s.label])
    ),
    colorTransfer: Object.fromEntries(
      COLOR_TRANSFERS.map((s) => [s.value, s.label])
    ),
    detailLevel: Object.fromEntries(
      DETAIL_LEVELS.map((s) => [s.value, s.label])
    ),
  };

  return labelMaps[key]?.[value] || value;
}

/**
 * Get label for architectural element
 */
export function getArchitecturalElementLabel(value: string): string {
  const element = ARCHITECTURAL_ELEMENTS.find((e) => e.value === value);
  return element?.label || value;
}
