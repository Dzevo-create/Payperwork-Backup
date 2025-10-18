/**
 * TypeScript types for Branding Enhancement
 */

import { BrandingSettingsType } from "@/types/workflows/brandingSettings";

/**
 * Image data structure for base64-encoded images
 */
export interface ImageData {
  data: string;
  mimeType: string;
}

/**
 * Options for enhanceBrandingPrompt function
 */
export interface BrandingEnhancementOptions {
  userPrompt: string;
  sourceImage: ImageData;
  settings?: BrandingSettingsType;
  referenceImages?: ImageData[];
}

/**
 * Options for generateBrandingPrompt function (T-Button)
 */
export interface BrandingPromptGenerationOptions {
  userPrompt: string | null;
  sourceImage: ImageData;
  settings?: BrandingSettingsType;
  referenceImage?: ImageData;
}

/**
 * Result from brand analysis
 */
export interface BrandAnalysisResult {
  guidelines: any | null; // BrandGuidelines from brandIntelligence
  error?: Error;
}
