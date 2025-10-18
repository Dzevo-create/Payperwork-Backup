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
import { buildFallbackPrompt } from "./fallback/fallbackHandler";
import { BrandingEnhancementOptions, BrandingPromptGenerationOptions, ImageData } from "./types";

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
  });

  try {
    // Step 1: Analyze brand
    const { guidelines } = await analyzeBrand(settings);

    // Step 2: Build brand context
    const brandContext = formatBrandContext(
      guidelines,
      settings?.brandingText,
      settings?.venueType
    );

    // Step 3: Build user message
    const userMessage = buildEnhancementUserMessage(
      userPrompt,
      brandContext,
      settings
    );

    // Step 4: Build messages with images
    const messages = buildMessagesWithImages(
      userMessage,
      sourceImage,
      referenceImages
    );

    // Step 5: Call API
    const enhancedPrompt = await callBrandingEnhancement(
      messages,
      settings?.brandingText
    );

    const duration = Date.now() - startTime;

    apiLogger.info("Branding Enhancement: Success", {
      duration,
      promptLength: enhancedPrompt.length,
      brand: settings?.brandingText,
    });

    return enhancedPrompt;

  } catch (error) {
    const duration = Date.now() - startTime;

    apiLogger.error("Branding Enhancement: Failed", {
      error,
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
 * @param options - Generation options
 * @returns Promise resolving to generated prompt string
 */
export async function generateBrandingPrompt(
  options: BrandingPromptGenerationOptions
): Promise<string> {
  const { userPrompt, sourceImage, settings, referenceImage } = options;
  const startTime = Date.now();

  apiLogger.info("Branding T-Button: Starting prompt generation", {
    hasUserPrompt: !!userPrompt,
    hasBrand: !!settings?.brandingText,
    hasReference: !!referenceImage,
  });

  try {
    // Step 1: Analyze brand
    const { guidelines } = await analyzeBrand(settings);

    // Step 2: Build brand context
    const brandContext = formatBrandContext(
      guidelines,
      settings?.brandingText,
      settings?.venueType
    );

    // Step 3: Build T-Button user message
    let userMessage = `Analyze this space and generate a detailed prompt for transforming it into a photorealistic branded environment rendering.`;

    if (brandContext) {
      userMessage += `\n\n${brandContext}`;
    }

    if (userPrompt) {
      userMessage += `\n\nUser preference: ${userPrompt}`;
    }

    // Add settings context
    if (settings?.renderStyle) {
      userMessage += `\n\nRender style: ${settings.renderStyle}`;
    }
    if (settings?.timeOfDay) {
      userMessage += `\n\nTime of day: ${settings.timeOfDay}`;
    }
    if (settings?.preserveEmptySpace) {
      userMessage += `\n\nKeep spaces minimal and unfurnished.`;
    } else {
      userMessage += `\n\nFill the space with furniture, decorations, and brand elements.`;
    }

    userMessage += `\n\nStart with: "Exact same camera angle and perspective as source. Transform this space into a ${settings?.brandingText || "branded"} ${settings?.venueType || "space"}."`;

    // Step 4: Build messages (with reference image if provided)
    const messages = buildMessagesWithImages(
      userMessage,
      sourceImage,
      referenceImage ? [referenceImage] : undefined
    );

    // Step 5: Call API
    const generatedPrompt = await callBrandingEnhancement(
      messages,
      settings?.brandingText
    );

    const duration = Date.now() - startTime;

    apiLogger.info("Branding T-Button: Success", {
      duration,
      promptLength: generatedPrompt.length,
      brand: settings?.brandingText,
    });

    return generatedPrompt;

  } catch (error) {
    const duration = Date.now() - startTime;

    apiLogger.error("Branding T-Button: Failed", {
      error,
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
