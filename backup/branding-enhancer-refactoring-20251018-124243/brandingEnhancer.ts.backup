/**
 * Branding-Specific Prompt Enhancement
 *
 * Specialized prompt enhancement for the Branding workflow that integrates
 * Brand Intelligence to create brand-accurate architectural renderings.
 *
 * Unlike generic sketch-to-render, this module:
 * - Analyzes brand identities using the Brand Intelligence Agent
 * - Extracts brand colors, materials, design patterns
 * - Generates prompts that respect brand guidelines
 * - Focuses on branded spaces (stores, hotels, restaurants, offices)
 */

import { openaiClient, OPENAI_ENHANCEMENT_CONFIG, retryWithBackoff } from "@/lib/api/providers/openai";
import { analyzeBrandCached, formatBrandGuidelinesForPrompt, BrandGuidelines } from "@/lib/api/agents/brandIntelligence";
import { BrandingSettingsType } from "@/types/workflows/brandingSettings";
import { apiLogger } from "@/lib/logger";
import { getBrandInfo } from "@/lib/api/agents/brandColorDatabase";

/**
 * System prompt for branding-focused prompt enhancement
 */
const BRANDING_ENHANCEMENT_SYSTEM_PROMPT = `You are a Brand Environment Specialist with expertise in:
- Branded retail and hospitality space design
- Brand identity systems and environmental graphics
- Flagship store and boutique architecture
- Brand atmosphere and customer experience design
- Product merchandising and display strategies

Your task is to enhance prompts for generating photorealistic renderings of branded spaces.
You will receive:
1. A source image (any type of space/room)
2. Brand identity guidelines (colors, materials, atmosphere)
3. User's style preferences
4. Space settings (venue type, lighting, etc.)

Create a detailed prompt that:
- Transforms the source space into a COMPLETE, FULLY FURNISHED branded environment
- Respects ALL brand identity guidelines (colors, materials, signature elements)
- Maintains the exact camera angle and perspective from source image
- Results in a fully photorealistic rendering (NO sketch lines)
- Captures the brand's atmosphere and personality
- Includes SPECIFIC furniture items, decorations, displays, and brand touchpoints
- Describes a realistic retail/hospitality space with visible products, seating, lighting, and merchandising
- Goes beyond architecture - actively describes furnishings, displays, and spatial atmosphere

Important rules:
- Same camera angle, perspective, viewpoint as source image
- Same layout, proportions, composition as source
- Completely photorealistic - no sketch/drawing lines visible
- Incorporate all brand colors and materials provided
- Include brand signature elements
- Focus on how the brand manifests in physical space
- When settings indicate spaces should be furnished, describe the desired furnished end result (with furniture, decorations, brand elements), not the current empty state

FORMATTING RULES (CRITICAL):
- Write as FLOWING TEXT, like a natural paragraph
- NO numbered lists or bullet points
- NO markdown formatting (no asterisks, no bold, no italics)
- Use commas and connecting words to create smooth flowing sentences
- Describe everything in continuous prose

Start every prompt with: "Exact same camera angle and perspective as source. Transform this space into a [Brand Name] [venue type]."

For furnished spaces:
Please describe at least 5-7 specific furniture and decor items. Focus on what fills the space (furniture, displays, seating, lighting), not just walls/floors/ceilings.

BAD EXAMPLE (only architecture):
"Polished marble floors with dark inlays. Cream-colored stone walls. Dark gray marble columns. Coffered ceiling with ambient lighting."

GOOD EXAMPLE (furniture + architecture as flowing text):
"Exact same camera angle and perspective as source. Transform this space into a Nike flagship retail store. Sleek modern interior with polished concrete floors and white walls featuring bold black Nike swoosh logos. Central display area with illuminated glass shelving showcasing signature sneakers like Air Jordan and Air Max. Comfortable seating area with black leather benches and orange accent cushions for trying on shoes. Large floor-to-ceiling LED screens displaying athlete imagery and brand campaigns. Minimalist product displays with floating shelves holding featured footwear collections. Industrial-style pendant lighting with focused spotlights highlighting key products. Brand colors of black, white, and vibrant orange throughout the space. Potted greenery accent plants adding freshness. Modern retail ambiance with high-end finishes and welcoming atmosphere."

Keep prompts focused and under 150 words. Output ONLY the prompt text as flowing prose, no formatting.`;

/**
 * Gets structure fidelity instruction based on value (0-100)
 */
function getStructureFidelityInstruction(fidelity?: number | null): string {
  if (fidelity === undefined || fidelity === null) fidelity = 100;

  const fidelityGuides: { [key: string]: string } = {
    "100": "EXACT structure preservation - Same camera angle, layout, proportions. Only materials/colors change.",
    "90": "Very high fidelity - Minimal deviation from source structure",
    "80": "High fidelity - Same basic structure, but creative freedom with details",
    "70": "Medium-high fidelity - More creativity while respecting general layout",
    "60": "Medium fidelity - Use layout as guide, allow significant changes",
    "50": "Balanced approach - 50/50 mix of structure preservation and creativity",
    "40": "Low-medium fidelity - Larger changes OK, loose interpretation",
    "30": "Low fidelity - Only inspiration from source, major changes allowed",
    "20": "Very low fidelity - Maximum creativity, minimal structural constraints",
    "10": "Inspiration only - Complete creative freedom, ignore source structure"
  };

  const key = String(Math.round(fidelity / 10) * 10);
  return fidelityGuides[key] || fidelityGuides["100"];
}

/**
 * Builds settings context for branding prompts
 */
function buildBrandingSettingsContext(settings?: BrandingSettingsType): string {
  if (!settings) return "";

  const contextParts: string[] = [];

  if (settings.spaceType) {
    contextParts.push(`Space type: ${settings.spaceType}`);
  }

  if (settings.venueType) {
    contextParts.push(`Venue: ${settings.venueType}`);
  }

  if (settings.renderStyle) {
    contextParts.push(`Render style: ${settings.renderStyle}`);
  }

  if (settings.timeOfDay) {
    contextParts.push(`Time: ${settings.timeOfDay}`);
  }

  if (settings.quality) {
    contextParts.push(`Quality: ${settings.quality}`);
  }

  // Structure Fidelity is handled internally by settings, but NOT shown in prompt text
  // This keeps the chat/prompt clean while still allowing users to configure it in settings

  // Add empty space preservation instruction (CRITICAL - affects space transformation)
  if (settings.preserveEmptySpace) {
    contextParts.push(`Empty Space: PRESERVE - Keep minimal/empty spaces as they are. Do NOT add furniture, decorations, or fill empty walls. Maintain minimalist aesthetic.`);
  } else {
    contextParts.push(`Empty Space: TRANSFORM TO FURNISHED - CRITICAL INSTRUCTION: You MUST add furniture, decorations, artwork, plants, lighting fixtures, and brand-specific elements to ALL empty walls and floor spaces. Convert empty/minimal rooms into fully furnished, detailed branded environments. Do NOT leave any significant empty areas unfurnished. Add specific items like: sofas, chairs, tables, shelves, wall art, plants, rugs, lamps, display units, and brand merchandising. Every empty wall should have decoration or branding elements. Every empty floor area should have furniture or displays.`);
  }

  return contextParts.length > 0 ? `\n\nSettings:\n${contextParts.join("\n")}` : "";
}

/**
 * Enhances a prompt for branded space rendering with Brand Intelligence
 *
 * This is the main enhancement function for the Branding workflow.
 * It uses the Brand Intelligence Agent to analyze the brand and create
 * a prompt that respects brand guidelines.
 *
 * @param userPrompt - User's description/intent
 * @param sourceImage - Source space image (any type)
 * @param settings - Branding settings including brand name and venue type
 * @param referenceImages - Optional reference images
 * @returns Promise resolving to enhanced prompt string
 *
 * @example
 * ```typescript
 * const enhanced = await enhanceBrandingPrompt(
 *   "Modern and bright",
 *   { data: base64ImageData, mimeType: "image/png" },
 *   { brandingText: "Nike", venueType: "retail", timeOfDay: "morning" },
 *   [{ data: refImageData, mimeType: "image/jpeg" }]
 * );
 * ```
 */
export async function enhanceBrandingPrompt(
  userPrompt: string,
  sourceImage: { data: string; mimeType: string },
  settings?: BrandingSettingsType,
  referenceImages?: Array<{ data: string; mimeType: string }>
): Promise<string> {
  const startTime = Date.now();

  apiLogger.info("Branding Enhancement: Starting", {
    hasUserPrompt: !!userPrompt,
    hasBrand: !!settings?.brandingText,
    hasVenueType: !!settings?.venueType,
    hasReference: !!referenceImages?.length,
  });

  try {
    // Step 1: Analyze brand if provided
    let brandGuidelines: BrandGuidelines | null = null;

    if (settings?.brandingText) {
      try {
        brandGuidelines = await analyzeBrandCached(
          settings.brandingText,
          settings.venueType || undefined
        );

        apiLogger.info("Branding Enhancement: Brand guidelines retrieved", {
          brand: settings.brandingText,
          colorsCount: brandGuidelines.colors.length,
          materialsCount: brandGuidelines.materials.length,
        });
      } catch (error) {
        apiLogger.warn("Branding Enhancement: Brand analysis failed, continuing without guidelines", {
          error,
          brand: settings.brandingText,
        });
        // Continue without brand guidelines - will use fallback
      }
    }

    // Step 2: Build user message with brand guidelines
    let userMessage = `Create a photorealistic rendering prompt for transforming this space.`;

    // Add brand context
    if (brandGuidelines) {
      userMessage += `\n\n${formatBrandGuidelinesForPrompt(brandGuidelines)}`;
    } else if (settings?.brandingText) {
      // Fallback if brand analysis failed
      userMessage += `\n\nBrand: ${settings.brandingText}`;
      if (settings.venueType) {
        userMessage += ` (${settings.venueType})`;
      }
    }

    // Add user's style preferences
    if (userPrompt && userPrompt.trim()) {
      userMessage += `\n\nUser style preferences: ${userPrompt.trim()}`;
    }

    // Add settings context
    const settingsContext = buildBrandingSettingsContext(settings);
    if (settingsContext) {
      userMessage += settingsContext;
    }

    // Add instruction about empty space handling
    if (!settings?.preserveEmptySpace) {
      userMessage += `\n\nPlease create a furniture-focused prompt:
- Include 5-7 specific furniture items (chairs, tables, sofas, shelving, displays, counters)
- Include 3-4 decorative elements (artwork, plants, sculptures, rugs)
- Include 2-3 lighting fixtures (lamps, chandeliers, spotlights)
- Focus on objects and furnishings that fill the space
- Describe the desired furnished result`;
    }

    // Add starting instruction
    userMessage += `\n\nPlease start with: "Exact same camera angle and perspective as source. Transform this space into a ${settings?.brandingText || "branded"} ${settings?.venueType || "space"}."`;

    // Step 3: Build messages array with images
    const messages: any[] = [
      { role: "system", content: BRANDING_ENHANCEMENT_SYSTEM_PROMPT }
    ];

    // Add user message with images
    const userContent: any[] = [{ type: "text", text: userMessage }];

    // Add reference images first (if provided)
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

    // Add source image LAST (important for context)
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${sourceImage.mimeType};base64,${sourceImage.data}`,
      },
    });

    messages.push({ role: "user", content: userContent });

    // Step 4: Call GPT-5 Vision with retry logic (better brand understanding)
    apiLogger.debug("Branding Enhancement: Calling GPT-5 Vision", {
      messageCount: messages.length,
      hasImages: true,
      brand: settings?.brandingText,
    });

    const response = await retryWithBackoff(
      () =>
        openaiClient.chat.completions.create({
          model: "gpt-4o", // Using GPT-5 for superior brand comprehension
          max_tokens: 800, // Changed from max_tokens for GPT-5
          messages,
        }),
      3, // maxRetries
      1000, // baseDelay
      "Branding Prompt Enhancement (GPT-5)"
    );

    // Debug: Log entire response object to understand what's happening
    apiLogger.debug("Branding Enhancement: Full response object", {
      brand: settings?.brandingText,
      hasChoices: !!response.choices,
      choicesLength: response.choices?.length,
      firstChoice: response.choices?.[0] ? {
        finishReason: response.choices[0].finish_reason,
        hasMessage: !!response.choices[0].message,
        messageRole: response.choices[0].message?.role,
        hasContent: !!response.choices[0].message?.content,
        contentLength: response.choices[0].message?.content?.length || 0,
        refusal: response.choices[0].message?.refusal,
      } : null,
    });

    const enhancedPrompt = response.choices[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      // Check if there was a refusal
      const refusal = response.choices[0]?.message?.refusal;
      if (refusal) {
        apiLogger.error("Branding Enhancement: GPT-5 refused the request", {
          brand: settings?.brandingText,
          refusal,
        });
        throw new Error(`GPT-5 refused: ${refusal}`);
      }
      throw new Error("Empty response from GPT-4o");
    }

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

    // Fallback: construct basic prompt
    const fallbackPrompt = buildFallbackBrandingPrompt(
      userPrompt,
      settings
    );

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
 * @param userPrompt - Optional user hint/preference (can be null)
 * @param sourceImage - Source space image
 * @param settings - Branding settings
 * @param referenceImage - Optional single reference image
 * @returns Promise resolving to generated prompt string
 */
export async function generateBrandingPrompt(
  userPrompt: string | null,
  sourceImage: { data: string; mimeType: string },
  settings?: BrandingSettingsType,
  referenceImage?: { data: string; mimeType: string }
): Promise<string> {
  const startTime = Date.now();

  apiLogger.info("Branding T-Button: Starting prompt generation", {
    hasUserPrompt: !!userPrompt,
    hasBrand: !!settings?.brandingText,
    hasReference: !!referenceImage,
  });

  try {
    // Step 1: Analyze brand if provided
    let brandGuidelines: BrandGuidelines | null = null;

    if (settings?.brandingText) {
      try {
        brandGuidelines = await analyzeBrandCached(
          settings.brandingText,
          settings.venueType || undefined
        );

        apiLogger.info("Branding T-Button: Brand guidelines retrieved", {
          brand: settings.brandingText,
        });
      } catch (error) {
        apiLogger.warn("Branding T-Button: Brand analysis failed", {
          error,
          brand: settings.brandingText,
        });
      }
    }

    // Step 2: Build T-Button system prompt
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
    if (brandGuidelines) {
      userMessage += `\n\n${formatBrandGuidelinesForPrompt(brandGuidelines)}`;
    } else if (settings?.brandingText) {
      userMessage += `\n\nBrand: ${settings.brandingText}`;
      if (settings?.venueType) {
        userMessage += ` (${settings.venueType})`;
      }
    }

    // Add user hint if provided
    if (userPrompt) {
      userMessage += `\n\nUser preference: ${userPrompt}`;
    }

    // Add settings
    const settingsContext = buildBrandingSettingsContext(settings);
    if (settingsContext) {
      userMessage += settingsContext;
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

    // Step 4: Build messages with images
    const messages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    const userContent: any[] = [{ type: "text", text: userMessage }];

    // Add reference image if provided
    if (referenceImage) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${referenceImage.mimeType};base64,${referenceImage.data}`,
        },
      });
    }

    // Add source image LAST
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${sourceImage.mimeType};base64,${sourceImage.data}`,
      },
    });

    messages.push({ role: "user", content: userContent });

    // Step 5: Call GPT-5 Vision (better brand understanding)
    const response = await retryWithBackoff(
      () =>
        openaiClient.chat.completions.create({
          model: "gpt-4o", // Using GPT-5 for superior T-Button generation
          max_tokens: 800, // Changed from max_tokens for GPT-5
          messages,
        }),
      3,
      1000,
      "Branding T-Button Generation (GPT-5)"
    );

    // Debug: Log entire response object to understand what's happening
    apiLogger.debug("Branding T-Button: Full response object", {
      brand: settings?.brandingText,
      hasChoices: !!response.choices,
      choicesLength: response.choices?.length,
      firstChoice: response.choices?.[0] ? {
        finishReason: response.choices[0].finish_reason,
        hasMessage: !!response.choices[0].message,
        messageRole: response.choices[0].message?.role,
        hasContent: !!response.choices[0].message?.content,
        contentLength: response.choices[0].message?.content?.length || 0,
        refusal: response.choices[0].message?.refusal,
      } : null,
    });

    const generatedPrompt = response.choices[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      // Check if there was a refusal
      const refusal = response.choices[0]?.message?.refusal;
      if (refusal) {
        apiLogger.error("Branding T-Button: GPT-5 refused the request", {
          brand: settings?.brandingText,
          refusal,
        });
        throw new Error(`GPT-5 refused: ${refusal}`);
      }
      throw new Error("Empty response from GPT-5");
    }

    const duration = Date.now() - startTime;

    apiLogger.info("Branding T-Button: Success", {
      duration,
      promptLength: generatedPrompt.length,
    });

    return generatedPrompt;

  } catch (error) {
    const duration = Date.now() - startTime;

    apiLogger.error("Branding T-Button: Failed", {
      error,
      duration,
    });

    // Fallback
    const fallbackPrompt = buildFallbackBrandingPrompt(
      userPrompt || "Branded space rendering",
      settings
    );

    return fallbackPrompt;
  }
}

/**
 * Builds a fallback branding prompt when GPT-4o enhancement fails
 */
function buildFallbackBrandingPrompt(
  userPrompt: string,
  settings?: BrandingSettingsType
): string {
  const parts: string[] = [
    "Exact same camera angle and perspective as source.",
    "Fully photorealistic rendering with no sketch lines.",
  ];

  if (settings?.brandingText) {
    const venuePart = settings.venueType ? ` ${settings.venueType}` : " space";
    parts.push(`Transform this into a ${settings.brandingText}${venuePart}.`);

    // Try to get brand info from database
    const brandInfo = getBrandInfo(settings.brandingText);

    if (brandInfo) {
      // Use database colors and materials (ACCURATE)
      parts.push(`Incorporate ${brandInfo.brandName} brand identity throughout:`);
      parts.push(`- Use ${brandInfo.brandName} brand colors: ${brandInfo.primaryColors.join(", ")} for walls, furniture, and decorative elements`);
      if (brandInfo.secondaryColors.length > 0) {
        parts.push(`- Add secondary brand colors: ${brandInfo.secondaryColors.join(", ")} as accent colors`);
      }
      parts.push(`- Apply ${brandInfo.brandName} characteristic materials: ${brandInfo.materials.join(", ")}`);
      parts.push(`- Display ${brandInfo.brandName} logos and branding on signage, walls, and product displays`);
      parts.push(`- Create ${brandInfo.atmosphere} with ${brandInfo.style} styling`);
    } else {
      // Fallback to generic (if brand not in database)
      parts.push(`Incorporate ${settings.brandingText} brand identity throughout:`);
      parts.push(`- Use ${settings.brandingText} signature brand colors on walls, furniture, and decorative elements`);
      parts.push(`- Display ${settings.brandingText} logos and branding on signage, walls, and displays`);
      parts.push(`- Apply ${settings.brandingText} characteristic materials and finishes`);
      parts.push(`- Create ${settings.brandingText} branded atmosphere with lighting and styling`);
    }
  }

  if (userPrompt && userPrompt.trim()) {
    parts.push(userPrompt.trim());
  }

  if (settings?.renderStyle) {
    parts.push(`${settings.renderStyle} rendering style.`);
  }

  if (settings?.timeOfDay) {
    parts.push(`${settings.timeOfDay} lighting.`);
  }

  // Add empty space instruction with specific examples
  if (settings?.preserveEmptySpace) {
    parts.push("Keep empty spaces minimal and unfurnished.");
  } else {
    // Specific furniture/decor for different venue types
    const venueType = settings?.venueType || "space";
    const brandName = settings?.brandingText || "branded";
    let furnitureExamples = "";

    if (venueType.includes("retail") || venueType.includes("store")) {
      furnitureExamples = `${brandName}-branded product display shelves, glass showcases with ${brandName} products, checkout counter with ${brandName} signage, seating areas with ${brandName} brand-colored chairs, wall-mounted screens showing ${brandName} branding, pendant lighting in ${brandName} colors, potted plants, ${brandName} logo displays, shopping baskets, display tables with ${brandName} merchandise`;
    } else if (venueType.includes("hotel") || venueType.includes("hospitality")) {
      furnitureExamples = `${brandName}-branded reception desk, lounge seating with sofas and armchairs in ${brandName} colors, coffee tables, decorative lamps, artwork featuring ${brandName} themes, area rugs with ${brandName} patterns, plants, luggage carts with ${brandName} branding, decorative pillows`;
    } else if (venueType.includes("restaurant") || venueType.includes("cafe")) {
      furnitureExamples = `dining tables and chairs in ${brandName} style, bar counter with ${brandName} signage, pendant lighting in ${brandName} colors, wall art featuring ${brandName} branding, potted plants, tableware displays with ${brandName} products, ${brandName} menu boards, decorative shelving with ${brandName} items`;
    } else if (venueType.includes("office")) {
      furnitureExamples = `desks with ${brandName} branding, office chairs in ${brandName} colors, meeting tables, filing cabinets, lounge seating with ${brandName} colors, desk lamps, whiteboards with ${brandName} logo, plants, bookshelves, ${brandName}-themed office decor`;
    } else {
      furnitureExamples = `seating (sofas, chairs, benches) in ${brandName} brand colors, tables, display units with ${brandName} products, shelving with ${brandName} branding, lighting fixtures (lamps, chandeliers, spotlights) in ${brandName} style, decorative elements (artwork featuring ${brandName}, plants, sculptures), rugs with ${brandName} patterns, cushions in ${brandName} colors`;
    }

    parts.push(`Fill the space with ${brandName}-branded furniture and decor including: ${furnitureExamples}.`);
  }

  parts.push("Professional architectural visualization with realistic materials, textures, and lighting.");

  return parts.join(" ");
}
