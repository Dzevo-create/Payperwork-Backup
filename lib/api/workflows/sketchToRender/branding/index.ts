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
      settings?.brandingText ?? undefined,
      settings?.venueType ?? undefined
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
  });

  try {
    // Step 1: Analyze brand if provided
    const { guidelines } = await analyzeBrand(settings);

    // Step 2: Build T-Button system prompt (SPECIFIC for T-Button, different from enhancement!)
    const systemPrompt = `You are a Brand Space Visualization Expert specializing in analyzing spaces and generating detailed prompts for branded environment renderings.

Analyze the provided space image and generate a COMPLETE, DETAILED prompt for transforming it into a branded space.

Your prompt should focus on FURNISHINGS and OBJECTS that FILL the space, not just architectural finishes.

Please include:
- 5-7 specific furniture items (sofas, chairs, tables, shelving units, display cases, counters)
- 3-4 decorative elements (wall art, plants, sculptures, rugs, cushions)
- 2-3 lighting fixtures (chandeliers, floor lamps, spotlights, pendant lights)
- Product displays or brand merchandising (if retail/hospitality)
- Seating areas or functional zones
- Brand-specific colors and materials
- Atmospheric details (ambiance, style, feeling)

Please focus on describing what fills the space (furniture, displays, decor), not just walls, floors, and ceilings. Describe the desired furnished end result with specific objects.

FORMATTING RULES (CRITICAL):
- Write as FLOWING TEXT, like a natural paragraph
- NO numbered lists or bullet points
- NO markdown formatting (no asterisks ** for bold, no _ for italics, no # for headers)
- Use commas and connecting words to create smooth flowing sentences
- Describe everything in continuous prose
- Write naturally, like describing a scene to someone

BAD EXAMPLE (only architecture):
"Polished marble floors with dark inlays. Cream-colored stone walls. Dark gray marble columns. Coffered ceiling with ambient lighting."

GOOD EXAMPLE (furniture-focused as flowing text):
"Exact same camera angle and perspective as source. Transform this space into a Nike flagship retail store. Sleek modern interior with polished concrete floors and white walls featuring bold black Nike swoosh logos. Central display area with illuminated glass shelving showcasing signature sneakers like Air Jordan and Air Max. Comfortable seating area with black leather benches and orange accent cushions for trying on shoes. Large floor-to-ceiling LED screens displaying athlete imagery and brand campaigns. Minimalist product displays with floating shelves holding featured footwear collections. Industrial-style pendant lighting with focused spotlights highlighting key products. Brand colors of black, white, and vibrant orange throughout the space. Potted greenery accent plants adding freshness. Modern retail ambiance with high-end finishes and welcoming atmosphere."

Generate a comprehensive, furniture-focused prompt that could be used directly for image generation.
Output ONLY the prompt text as flowing prose, no formatting, no explanations.`;

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
      userMessage += `\n\nPlease generate a furniture-rich prompt that describes a fully furnished space:
- Include around 5-7 specific furniture items (sofas, chairs, tables, shelving, display cases, counters)
- Include around 3-4 decorative elements (wall art, plants, sculptures, rugs)
- Include around 2-3 lighting fixtures (chandeliers, lamps, spotlights, pendant lights)
- Describe seating areas, product displays, or functional brand zones
- Focus on objects and furnishings that fill the space, not just architectural finishes
- Describe the desired furnished result, not the current empty state`;
    }

    userMessage += `\n\nGenerate a complete, detailed prompt that preserves the exact camera angle and transforms this space into a branded environment.`;

    // Step 4: Build messages with images (using the T-Button specific system prompt!)
    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    const userContent: any[] = [{ type: "text", text: userMessage }];

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
