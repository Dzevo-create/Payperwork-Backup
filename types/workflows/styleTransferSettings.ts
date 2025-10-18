/**
 * Style-Transfer Workflow Settings Types
 *
 * Defines all settings for the Style-Transfer workflow which transfers
 * architectural styles and materialities from reference images to designs.
 */

// Architectural Style - Pre-defined architectural styles
export type ArchitecturalStyle =
  | "modern"
  | "contemporary"
  | "minimalist"
  | "industrial"
  | "mediterranean"
  | "scandinavian"
  | "classical"
  | "baroque"
  | "art_deco"
  | "brutalist"
  | "gothic"
  | "renaissance";

// Transfer Intensity - How strongly the style is transferred
export type TransferIntensity = "subtle" | "balanced" | "strong";

// Material Palette - Types of materials to focus on
export type MaterialPalette =
  | "natural"        // Wood, Stone
  | "industrial"     // Metal, Concrete
  | "luxury"         // Marble, Gold
  | "rustic"         // Wood, Brick
  | "modern"         // Glass, Steel
  | "traditional"    // Stone, Wood
  | "mixed";         // Combination

// Color Scheme - Color palettes
export type ColorScheme =
  | "neutral"          // White, Gray, Beige
  | "warm"             // Red, Orange, Yellow
  | "cool"             // Blue, Green, Violet
  | "monochrome"       // One color
  | "vibrant"          // Bold colors
  | "pastel"           // Soft colors
  | "earth_tones"      // Brown, Terracotta
  | "jewel_tones"      // Emerald, Ruby
  | "black_white"      // Black & White
  | "gold_accent";     // Gold accents

// Accent Color - Specific primary color
export type AccentColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "orange"
  | "purple"
  | "pink"
  | "gold"
  | "silver"
  | "bronze"
  | "white"
  | "black";

// Architectural Elements - Specific elements that can be transferred
export type ArchitecturalElement =
  | "facade"
  | "windows"
  | "doors"
  | "roof"
  | "columns"
  | "ornaments"
  | "textures"
  | "lighting";

/**
 * Complete Style-Transfer Settings Interface
 */
export interface StyleTransferSettingsType extends Record<string, unknown> {
  // 1. Architectural style (optional - guides the transfer)
  architecturalStyle: ArchitecturalStyle | null;

  // 2. Transfer intensity (how strongly to apply the style)
  transferIntensity: TransferIntensity;

  // 3. Style strength (0-100%)
  styleStrength: number;

  // 4. Structure preservation (0-100%)
  structurePreservation: number;

  // 5. Material palette (which materials to focus on)
  materialPalette: MaterialPalette | null;

  // 6. Color scheme (color palette)
  colorScheme: ColorScheme | null;

  // 7. Accent color (optional primary color)
  accentColor: AccentColor | null;
}

/**
 * Default Style-Transfer Settings
 * Balanced configuration for most use cases
 */
export const DEFAULT_STYLE_TRANSFER_SETTINGS: StyleTransferSettingsType = {
  architecturalStyle: null,      // No pre-defined style - let reference image guide
  transferIntensity: "balanced", // Balanced transfer
  styleStrength: 70,             // 70% style strength
  structurePreservation: 80,     // 80% structure preservation
  materialPalette: null,         // No specific material palette - use reference
  colorScheme: null,             // No specific color scheme - use reference
  accentColor: null,             // No accent color - use reference
};
