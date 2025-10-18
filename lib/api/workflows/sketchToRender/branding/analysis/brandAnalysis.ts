/**
 * Brand Analysis Module
 *
 * Handles brand intelligence analysis and guideline formatting
 */

import { analyzeBrandCached, formatBrandGuidelinesForPrompt, BrandGuidelines } from "@/lib/api/agents/brandIntelligence";
import { apiLogger } from "@/lib/logger";
import { BrandingSettingsType } from "@/types/workflows/brandingSettings";
import { BrandAnalysisResult } from "../types";

/**
 * Analyzes a brand and retrieves guidelines
 * Returns null if brand is not provided or analysis fails
 */
export async function analyzeBrand(
  settings?: BrandingSettingsType
): Promise<BrandAnalysisResult> {
  if (!settings?.brandingText) {
    return { guidelines: null };
  }

  try {
    const guidelines = await analyzeBrandCached(
      settings.brandingText,
      settings.venueType || undefined
    );

    apiLogger.info("Brand Analysis: Success", {
      brand: settings.brandingText,
      colorsCount: guidelines.colors.length,
      materialsCount: guidelines.materials.length,
    });

    return { guidelines };
  } catch (error) {
    apiLogger.warn("Brand Analysis: Failed, continuing without guidelines", {
      error,
      brand: settings.brandingText,
    });

    return { guidelines: null, error: error as Error };
  }
}

/**
 * Formats brand guidelines for inclusion in prompt
 */
export function formatBrandContext(
  guidelines: BrandGuidelines | null,
  brandName?: string,
  venueType?: string
): string {
  if (guidelines) {
    return formatBrandGuidelinesForPrompt(guidelines);
  }

  if (brandName) {
    let context = `Brand: ${brandName}`;
    if (venueType) {
      context += ` (${venueType})`;
    }
    return context;
  }

  return "";
}
