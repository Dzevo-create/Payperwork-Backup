/**
 * Branding Enhancement - Main Entry Point
 *
 * Orchestrates brand analysis, prompt building, and API calls
 * for branded space rendering prompts
 */

import { apiLogger } from "@/lib/logger";
import { BrandingSettingsType } from "@/types/workflows/brandingSettings";
import { analyzeBrand, formatBrandContext } from "./analysis/brandAnalysis";
import { buildEnhancementUserMessage } from "./builders/promptBuilder";
import { buildMessagesWithImages } from "./builders/messageBuilder";
import { callBrandingEnhancement } from "./client/apiClient";
import { getBrandingSystemPrompt } from "./constants";
import { buildFallbackPrompt } from "./fallback/fallbackHandler";
import { BrandingEnhancementOptions, BrandingPromptGenerationOptions, ImageData } from "./types";
import { enhanceBrandingPromptTwoStage } from "./twoStageEnhancement";

/**
 * Enhances a prompt for branded space rendering with Brand Intelligence
 *
 * This is the main enhancement function for the Branding workflow.
 * It uses the Brand Intelligence Agent to analyze the brand and create
 * a prompt that respects brand guidelines.
 *
 * @param options - Enhancement options
 * @returns Promise resolving to enhanced prompt string
 *
 * @example
 * ```typescript
 * const enhanced = await enhanceBrandingPrompt({
 *   userPrompt: "Modern and bright",
 *   sourceImage: { data: base64ImageData, mimeType: "image/png" },
 *   settings: { brandingText: "Nike", venueType: "retail", timeOfDay: "morning" },
 *   referenceImages: [{ data: refImageData, mimeType: "image/jpeg" }]
 * });
 * ```
 */
export async function enhanceBrandingPrompt(
  options: BrandingEnhancementOptions
): Promise<string> {
  const { userPrompt, sourceImage, settings, referenceImages } = options;
  const startTime = Date.now();

  apiLogger.info("Branding Enhancement: Starting", {
    hasUserPrompt: !!userPrompt,
    hasBrand: !!settings?.brandingText,
    hasVenueType: !!settings?.venueType,
    hasReference: !!referenceImages?.length,
    spaceType: settings?.spaceType || "not-set",
    usingExteriorPrompt: settings?.spaceType === "exterior",
  });

  try {
    // Step 1: Analyze brand
    const { guidelines } = await analyzeBrand(settings);

    // Step 2: Use TWO-STAGE enhancement for better brand accuracy
    // Stage 1: GPT-4o Vision analyzes structure WITHOUT brand details
    // Stage 2: GPT-4o combines structure WITH exact brand guidelines
    // This prevents Vision model from "reinterpreting" hex codes and materials
    const enhancedPrompt = await enhanceBrandingPromptTwoStage(
      userPrompt,
      sourceImage,
      guidelines,
      settings,
      referenceImages
    );

    const duration = Date.now() - startTime;

    apiLogger.info("Branding Enhancement: Success (Two-Stage)", {
      duration,
      promptLength: enhancedPrompt.length,
      brand: settings?.brandingText,
    });

    return enhancedPrompt;

  } catch (error) {
    const duration = Date.now() - startTime;

    apiLogger.error("Branding Enhancement: Failed", error instanceof Error ? error : undefined, {
      duration,
      brand: settings?.brandingText,
    });

    // Fallback
    const fallbackPrompt = buildFallbackPrompt(userPrompt, settings);

    apiLogger.warn("Branding Enhancement: Using fallback prompt", {
      fallbackLength: fallbackPrompt.length,
    });

    return fallbackPrompt;
  }
}

/**
 * Generates a T-Button prompt for Branding workflow
 *
 * This function is called when the user clicks the T-Button (analyze image).
 * It analyzes the source image and brand to generate a complete prompt.
 *
 * @param userPrompt - Optional user prompt text
 * @param sourceImage - Source image data
 * @param settings - Optional branding settings
 * @param referenceImages - Optional reference images array
 * @returns Promise resolving to generated prompt string
 */
export async function generateBrandingPrompt(
  userPrompt: string | null,
  sourceImage: ImageData,
  settings?: BrandingSettingsType,
  referenceImages?: ImageData[]
): Promise<string> {
  const startTime = Date.now();

  apiLogger.info("Branding T-Button: Starting prompt generation", {
    hasUserPrompt: !!userPrompt,
    hasBrand: !!settings?.brandingText,
    hasReference: !!referenceImages?.length,
    spaceType: settings?.spaceType || "not-set",
    usingExteriorPrompt: settings?.spaceType === "exterior",
  });

  try {
    // Step 1: Analyze brand if provided
    const { guidelines } = await analyzeBrand(settings);

    // Step 2: Use TWO-STAGE enhancement for T-Button
    // This provides better brand accuracy than single-stage
    const generatedPrompt = await enhanceBrandingPromptTwoStage(
      userPrompt || "",
      sourceImage,
      guidelines,
      settings,
      referenceImages
    );

    const duration = Date.now() - startTime;

    apiLogger.info("Branding T-Button: Success (Two-Stage)", {
      duration,
      promptLength: generatedPrompt.length,
      brand: settings?.brandingText,
    });

    return generatedPrompt;

  } catch (error) {
    const duration = Date.now() - startTime;

    apiLogger.error("Branding T-Button: Failed", error instanceof Error ? error : undefined, {
      duration,
      brand: settings?.brandingText,
    });

    // Fallback
    const fallbackPrompt = buildFallbackPrompt(userPrompt || "", settings);

    apiLogger.warn("Branding T-Button: Using fallback prompt", {
      fallbackLength: fallbackPrompt.length,
    });

    return fallbackPrompt;
  }
}

// Re-export types for convenience
export type { BrandingEnhancementOptions, BrandingPromptGenerationOptions, ImageData };
