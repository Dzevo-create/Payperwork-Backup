// types/workflows/renderToCadSettings.ts

/**
 * Output Type
 * Ob das generierte CAD mit oder ohne Metadaten kommt
 */
export type OutputType = "with_metadata" | "without_metadata";

/**
 * Detail Level Type
 * Bestimmt die Detailtiefe der Zeichnung
 */
export type DetailLevel = "overview" | "standard" | "detailed";

/**
 * Render-to-CAD Settings Type (Simplified to 2 essential settings)
 */
export type RenderToCadSettingsType = {
  outputType: OutputType;
  detailLevel: DetailLevel;
};

/**
 * Default Settings
 */
export const DEFAULT_RENDER_TO_CAD_SETTINGS: RenderToCadSettingsType = {
  outputType: "with_metadata",
  detailLevel: "standard",
};
