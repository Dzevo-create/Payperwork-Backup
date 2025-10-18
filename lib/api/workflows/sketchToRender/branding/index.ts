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

    // Step 2: Build brand context
    const brandContext = formatBrandContext(
      guidelines,
      settings?.brandingText ?? undefined,
      settings?.venueType ?? undefined
    );

    // Step 3: Build user message
    const userMessage = buildEnhancementUserMessage(
      userPrompt,
      brandContext,
      settings
    );

    // Step 4: Build messages with images (pass spaceType for correct system prompt)
    const messages = buildMessagesWithImages(
      userMessage,
      sourceImage,
      referenceImages,
      settings?.spaceType
    );

    // Step 5: Call API
    const enhancedPrompt = await callBrandingEnhancement(
      messages,
      settings?.brandingText ?? undefined
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

    // Step 2: Use the same system prompt selection logic as enhancement
    const systemPrompt = getBrandingSystemPrompt(settings?.spaceType);

    apiLogger.info("🔍 T-Button: System Prompt Selection", {
      spaceType: settings?.spaceType || "not-set",
      promptType: settings?.spaceType === "exterior" ? "EXTERIOR (strict)" : "INTERIOR (default)",
      promptLength: systemPrompt.length,
      containsForbiddenWarning: systemPrompt.includes("FORBIDDEN")
    });

    // Step 3: Build user message
    let userMessage = `Analyze this space and generate a detailed prompt for transforming it into a photorealistic branded environment rendering.`;

    // Add brand guidelines
    const brandContext = formatBrandContext(
      guidelines,
      settings?.brandingText ?? undefined,
      settings?.venueType ?? undefined
    );

    if (brandContext) {
      userMessage += `\n\n${brandContext}`;
    }

    // Add user hint if provided
    if (userPrompt) {
      userMessage += `\n\nUser preference: ${userPrompt}`;
    }

    // Add settings
    if (settings?.renderStyle) {
      userMessage += `\n\nRender style: ${settings.renderStyle}`;
    }
    if (settings?.timeOfDay) {
      userMessage += `\n\nTime of day: ${settings.timeOfDay}`;
    }

    // Add critical instruction about empty space handling
    if (!settings?.preserveEmptySpace) {
      if (settings?.spaceType === "exterior") {
        userMessage += `\n\nPlease create an EXTERIOR-focused prompt:
- Include EXTERIOR branding elements (signage, logos on building facade, brand displays)
- Include EXTERIOR fixtures (facade lighting, entrance canopy, awnings, architectural features)
- Include landscape elements (planters, outdoor plants, trees, entrance area)
- Include atmospheric elements (weather, lighting conditions, street presence)
- Focus on branded ARCHITECTURAL features and OUTDOOR environment
- CRITICAL: Do NOT include ANY interior elements (NO furniture, NO display cases, NO indoor lighting, NO floors, NO seating areas)
- Describe the desired branded EXTERIOR result - what the building looks like from the STREET`;
      } else {
        userMessage += `\n\nPlease generate a furniture-rich prompt that describes a fully furnished space:
- Include around 5-7 specific furniture items (sofas, chairs, tables, shelving, display cases, counters)
- Include around 3-4 decorative elements (wall art, plants, sculptures, rugs)
- Include around 2-3 lighting fixtures (chandeliers, lamps, spotlights, pendant lights)
- Describe seating areas, product displays, or functional brand zones
- Focus on objects and furnishings that fill the space, not just architectural finishes
- Describe the desired furnished result, not the current empty state`;
      }
    }

    userMessage += `\n\nGenerate a complete, detailed prompt that preserves the exact camera angle and transforms this ${settings?.spaceType === "exterior" ? "building exterior" : "space"} into a branded environment.`;

    // Step 4: Build messages with images (using the T-Button specific system prompt!)
    interface MessageContent {
      type: "text" | "image_url";
      text?: string;
      image_url?: {
        url: string;
        detail?: "high" | "low";
      };
    }

    interface ChatMessage {
      role: "system" | "user";
      content: string | MessageContent[];
    }

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt }
    ];

    const userContent: MessageContent[] = [{ type: "text", text: userMessage }];

    // Add reference images if provided
    if (referenceImages && referenceImages.length > 0) {
      for (const refImage of referenceImages) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:${refImage.mimeType};base64,${refImage.data}`,
          },
        });
      }
    }

    // Add source image LAST
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${sourceImage.mimeType};base64,${sourceImage.data}`,
      },
    });

    messages.push({ role: "user", content: userContent });

    // Step 5: Call API (still uses GPT-4o but with the correct system prompt now!)
    const generatedPrompt = await callBrandingEnhancement(
      messages,
      settings?.brandingText ?? undefined
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
