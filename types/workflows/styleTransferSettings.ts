/**
 * Style-Transfer Workflow Settings Types
 *
 * Defines all settings for the Style-Transfer workflow which transfers
 * architectural styles and materialities from reference images to designs.
 */

// Transfer Mode - How strongly the style is transferred
export type TransferMode = "subtle" | "balanced" | "strong";

// Material Transfer - Which materials are transferred
export type MaterialTransfer = "none" | "partial" | "full" | "selective";

// Color Transfer - Which colors are transferred
export type ColorTransfer = "none" | "palette" | "full" | "harmonized";

// Detail Level - How detailed the transfer is
export type DetailLevel = "low" | "medium" | "high" | "very_high";

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
  // Transfer mode
  transferMode: TransferMode;

  // Style strength (0-100%)
  styleStrength: number;

  // Structure preservation (0-100%)
  structurePreservation: number;

  // Material transfer mode
  materialTransfer: MaterialTransfer;

  // Color transfer mode
  colorTransfer: ColorTransfer;

  // Detail level
  detailLevel: DetailLevel;

  // Specific architectural elements to transfer (empty = all)
  architecturalElements: ArchitecturalElement[];
}

/**
 * Default Style-Transfer Settings
 * Balanced configuration for most use cases
 */
export const DEFAULT_STYLE_TRANSFER_SETTINGS: StyleTransferSettingsType = {
  transferMode: "balanced",
  styleStrength: 70,
  structurePreservation: 80,
  materialTransfer: "full",
  colorTransfer: "full",
  detailLevel: "high",
  architecturalElements: [], // Empty means transfer all elements
};
