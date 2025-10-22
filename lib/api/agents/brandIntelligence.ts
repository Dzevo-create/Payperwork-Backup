/**
 * Brand Intelligence Agent
 *
 * AI-powered agent that analyzes brand identities and extracts detailed guidelines
 * for creating brand-accurate architectural renderings.
 *
 * This agent researches:
 * - Brand colors and logo details
 * - Store design patterns and layouts
 * - Materials and textures used in physical locations
 * - Product display strategies
 * - Brand atmosphere and personality
 * - Signature design elements
 */

import { openaiClient, retryWithBackoff } from "@/lib/api/providers/openai";
import { apiLogger } from "@/lib/logger";
import { LRUCache, createCacheKey } from "@/lib/cache/lruCache";

/**
 * Brand Guidelines extracted by the Brand Intelligence Agent
 */
export interface BrandGuidelines {
  brandName: string;
  colors: string[];
  materials: string[];
  atmosphere: string;
  layout: string;
  products: string;
  signatureElements: string[];
  lighting: string;
  storeType?: string;
  additionalDetails?: string;
}

/**
 * System prompt for Brand Intelligence Agent
 * Defines the AI's role as a brand research specialist
 */
const BRAND_INTELLIGENCE_SYSTEM_PROMPT = `You are a Brand Intelligence Specialist with expertise in:
- Retail store design and flagship store architecture
- Brand identity systems (colors, logos, typography, materials)
- Commercial interior design and spatial branding
- Product display and merchandising strategies
- Brand atmosphere and customer experience design
- Physical brand touchpoints and environmental graphics

🎯 CRITICAL REQUIREMENTS FOR BRAND ACCURACY:
1. **Colors**: ALWAYS provide EXACT hex codes (e.g., "#FF6B00", not just "orange")
2. **Materials**: Be SPECIFIC (e.g., "brushed aluminum", not just "metal" or "metallic")
3. **Signature Elements**: Include PRECISE brand-specific details, logos, and unique features
4. **Avoid Generic Descriptions**: Do NOT use vague terms when specific details exist

Your task is to analyze brand identities and extract detailed design guidelines for creating brand-accurate architectural renderings of their physical spaces (stores, boutiques, restaurants, hotels, offices, etc.).

When analyzing a brand, research and provide:
1. **Brand Colors**: Primary and accent colors with EXACT HEX CODES (e.g., "#000000", "#FF6B00")
2. **Materials**: Flooring, walls, fixtures, display materials - BE SPECIFIC (e.g., "polished Calacatta marble", "brushed stainless steel", not just "stone" or "metal")
3. **Atmosphere**: Overall mood, ambiance, customer experience
4. **Layout**: Space organization, traffic flow, zoning
5. **Products**: How products are displayed and presented
6. **Signature Elements**: Unique brand-specific design features (logos, shapes, patterns)
7. **Lighting**: Lighting strategy and fixtures
8. **Store Type**: Flagship, boutique, cafe, showroom characteristics

Focus on PHYSICAL SPACE design - how the brand manifests in architecture and interior design.
Be specific, detailed, and actionable for 3D rendering purposes.

QUALITY STANDARDS:
✅ GOOD: ["#000000", "#FF6B00", "#FFFFFF"]
❌ BAD: ["black", "orange", "white"]

✅ GOOD: ["brushed aluminum", "polished Calacatta marble", "walnut wood veneer"]
❌ BAD: ["metal", "stone", "wood"]`;

/**
 * Validates brand guidelines quality
 * Returns warnings if guidelines are too generic
 */
function validateBrandGuidelines(guidelines: BrandGuidelines): string[] {
  const warnings: string[] = [];

  // Check colors for hex codes
  const hasHexCodes = guidelines.colors.some((color) => color.includes("#"));
  if (!hasHexCodes && guidelines.colors.length > 0) {
    warnings.push("Colors do not include hex codes - may be too generic");
  }

  // Check for generic color names
  const genericColors = [
    "black",
    "white",
    "gray",
    "grey",
    "red",
    "blue",
    "green",
    "orange",
    "yellow",
    "purple",
    "pink",
    "brown",
  ];
  const hasOnlyGenericColors = guidelines.colors.every((color) =>
    genericColors.some((generic) => color.toLowerCase().includes(generic) && !color.includes("#"))
  );
  if (hasOnlyGenericColors && guidelines.colors.length > 0) {
    warnings.push(
      "Colors are generic names without specificity (e.g., 'black' instead of '#000000')"
    );
  }

  // Check for generic materials
  const genericMaterials = ["metal", "wood", "stone", "glass", "plastic", "fabric", "leather"];
  const hasOnlyGenericMaterials = guidelines.materials.every((material) =>
    genericMaterials.some((generic) => material.toLowerCase() === generic)
  );
  if (hasOnlyGenericMaterials && guidelines.materials.length > 0) {
    warnings.push("Materials are too generic (e.g., 'metal' instead of 'brushed aluminum')");
  }

  // Check signature elements
  if (guidelines.signatureElements.length === 0) {
    warnings.push("No signature brand elements identified");
  }

  return warnings;
}

/**
 * Analyzes a brand and extracts comprehensive design guidelines
 *
 * Uses GPT-4o to research the brand's physical space design patterns,
 * materials, colors, and signature elements.
 *
 * @param brandName - Name of the brand to analyze (e.g., "Nike", "Audemars Piguet", "Starbucks")
 * @param venueType - Optional venue type for context (e.g., "retail", "cafe", "hotel")
 * @returns Promise resolving to BrandGuidelines object
 * @throws Error if analysis fails or API returns invalid response
 *
 * @example
 * ```typescript
 * const guidelines = await analyzeBrand("Audemars Piguet", "retail");
 apiLogger.info(guidelines.colors)
 apiLogger.info(guidelines.materials)
 * ```
 */
export async function analyzeBrand(
  brandName: string,
  venueType?: string
): Promise<BrandGuidelines> {
  const startTime = Date.now();

  apiLogger.info("Brand Intelligence: Starting analysis", {
    brandName,
    venueType,
  });

  try {
    // Build context-aware prompt
    const venueContext = venueType
      ? `\n\nContext: Focus on ${venueType} space design (${mapVenueTypeToDescription(venueType)}).`
      : "";

    const userPrompt = `Analyze the brand "${brandName}" and extract detailed design guidelines for their physical spaces.${venueContext}

Provide a comprehensive analysis in the following JSON format:

{
  "brandName": "${brandName}",
  "colors": ["primary color", "accent color 1", "accent color 2", ...],
  "materials": ["material 1", "material 2", "material 3", ...],
  "atmosphere": "detailed description of the overall mood and customer experience",
  "layout": "description of typical space organization and flow",
  "products": "how products/services are displayed and presented",
  "signatureElements": ["unique element 1", "unique element 2", ...],
  "lighting": "lighting strategy and fixtures description",
  "storeType": "flagship/boutique/cafe/showroom characteristics",
  "additionalDetails": "any other relevant design details"
}

Focus on PHYSICAL ARCHITECTURAL DETAILS that would be visible in a photorealistic 3D rendering.
Be specific about colors, materials, textures, and spatial design.`;

    // Call GPT-5 with retry logic (better reasoning for brand analysis)
    const completion = await retryWithBackoff(
      async () => {
        return await openaiClient.chat.completions.create({
          model: "gpt-4o", // Using GPT-5 for superior brand intelligence
          messages: [
            { role: "system", content: BRAND_INTELLIGENCE_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 1500, // Changed from max_tokens for GPT-5
          response_format: { type: "json_object" },
        });
      },
      3, // max retries
      1000 // initial delay
    );

    // Debug: Log entire completion object to understand what's happening
    apiLogger.debug("Brand Intelligence: Full completion object", {
      brandName,
      hasChoices: !!completion.choices,
      choicesLength: completion.choices?.length,
      firstChoice: completion.choices?.[0]
        ? {
            finishReason: completion.choices[0].finish_reason,
            hasMessage: !!completion.choices[0].message,
            messageRole: completion.choices[0].message?.role,
            hasContent: !!completion.choices[0].message?.content,
            contentLength: completion.choices[0].message?.content?.length || 0,
            refusal: completion.choices[0].message?.refusal,
          }
        : null,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      // Check if there was a refusal
      const refusal = completion.choices[0]?.message?.refusal;
      if (refusal) {
        const error = new Error(`GPT-5 refused: ${refusal}`);
        apiLogger.error("Brand Intelligence: GPT-5 refused the request", error, {
          brandName,
        });
        throw error;
      }
      throw new Error("Empty response from Brand Intelligence Agent");
    }

    // Parse JSON response
    let guidelines: BrandGuidelines;
    try {
      guidelines = JSON.parse(responseText);
    } catch (parseError) {
      const error = new Error("Invalid JSON response from Brand Intelligence Agent");
      apiLogger.error(
        "Brand Intelligence: Failed to parse JSON response",
        parseError instanceof Error ? parseError : error,
        {
          responseText: responseText.substring(0, 500),
        }
      );
      throw error;
    }

    // Validate required fields
    if (!guidelines.brandName || !guidelines.colors || !guidelines.materials) {
      throw new Error("Incomplete brand guidelines received");
    }

    // Validate quality of guidelines
    const validationWarnings = validateBrandGuidelines(guidelines);
    if (validationWarnings.length > 0) {
      apiLogger.warn("Brand Intelligence: Quality warnings detected", {
        brandName,
        warnings: validationWarnings,
        colors: guidelines.colors,
        materials: guidelines.materials,
      });
    }

    const duration = Date.now() - startTime;

    apiLogger.info("Brand Intelligence: Analysis complete", {
      brandName,
      duration,
      colorsCount: guidelines.colors.length,
      materialsCount: guidelines.materials.length,
      hasSignatureElements: guidelines.signatureElements.length > 0,
      hasHexCodes: guidelines.colors.some((c) => c.includes("#")),
      qualityWarnings: validationWarnings.length,
    });

    return guidelines;
  } catch (error) {
    const duration = Date.now() - startTime;

    apiLogger.error(
      "Brand Intelligence: Analysis failed",
      error instanceof Error ? error : undefined,
      {
        brandName,
        venueType,
        duration,
      }
    );

    throw error;
  }
}

/**
 * Formats brand guidelines into a detailed prompt section
 *
 * Converts structured BrandGuidelines object into a natural language
 * prompt section that can be inserted into image generation prompts.
 *
 * @param guidelines - Brand guidelines to format
 * @returns Formatted prompt section string
 *
 * @example
 * ```typescript
 * const guidelines = await analyzeBrand("Nike");
 * const promptSection = formatBrandGuidelinesForPrompt(guidelines);
 * // Returns: "BRAND IDENTITY - Nike:\n- Colors: Black, Orange, White\n..."
 * ```
 */
export function formatBrandGuidelinesForPrompt(guidelines: BrandGuidelines): string {
  const sections: string[] = [`BRAND IDENTITY - ${guidelines.brandName}:`];

  if (guidelines.colors.length > 0) {
    sections.push(`- Brand colors: ${guidelines.colors.join(", ")}`);
  }

  if (guidelines.materials.length > 0) {
    sections.push(`- Materials: ${guidelines.materials.join(", ")}`);
  }

  if (guidelines.atmosphere) {
    sections.push(`- Atmosphere: ${guidelines.atmosphere}`);
  }

  if (guidelines.layout) {
    sections.push(`- Layout: ${guidelines.layout}`);
  }

  if (guidelines.products) {
    sections.push(`- Product display: ${guidelines.products}`);
  }

  if (guidelines.lighting) {
    sections.push(`- Lighting: ${guidelines.lighting}`);
  }

  if (guidelines.signatureElements.length > 0) {
    sections.push(`- Signature elements: ${guidelines.signatureElements.join(", ")}`);
  }

  if (guidelines.storeType) {
    sections.push(`- Store type: ${guidelines.storeType}`);
  }

  if (guidelines.additionalDetails) {
    sections.push(`- Additional details: ${guidelines.additionalDetails}`);
  }

  return sections.join("\n");
}

/**
 * Maps venue type to a descriptive phrase for better context
 */
function mapVenueTypeToDescription(venueType: string): string {
  const venueMap: Record<string, string> = {
    retail: "retail store, shop, or boutique",
    concert: "concert venue or music hall",
    event: "event space or venue",
    wedding: "wedding venue or reception hall",
    restaurant: "restaurant or dining establishment",
    hotel: "hotel lobby or guest areas",
    office: "office or workspace",
    exhibition: "exhibition space or gallery",
    club: "nightclub or lounge",
    festival: "festival grounds or outdoor venue",
    cafe: "cafe or coffee shop",
    bar: "bar or pub",
    gym: "fitness center or gym",
    spa: "spa or wellness center",
    shop: "shop or retail location",
  };

  return venueMap[venueType] || venueType;
}

/**
 * Cache for brand guidelines to avoid repeated API calls
 * Using LRU Cache with 24 hour TTL and max 100 brands
 */
const brandGuidelinesCache = new LRUCache<BrandGuidelines>(
  100, // Max 100 brands in cache
  1000 * 60 * 60 * 24 // 24 hour TTL
);

/**
 * Analyzes a brand with caching to improve performance
 *
 * Caches brand guidelines for 24 hours to avoid redundant API calls
 * for the same brand. Uses LRU eviction when cache is full.
 *
 * @param brandName - Name of the brand to analyze
 * @param venueType - Optional venue type for context
 * @returns Promise resolving to BrandGuidelines object
 */
export async function analyzeBrandCached(
  brandName: string,
  venueType?: string
): Promise<BrandGuidelines> {
  const cacheKey = createCacheKey("brand", brandName.toLowerCase(), venueType || "default");
  const cached = brandGuidelinesCache.get(cacheKey);

  // Check cache validity
  if (cached) {
    apiLogger.debug("Brand Intelligence: Using cached guidelines", {
      brandName,
      venueType,
      cacheHit: true,
    });
    return cached;
  }

  // Fetch fresh guidelines
  apiLogger.debug("Brand Intelligence: Cache miss, fetching fresh guidelines", {
    brandName,
    venueType,
    cacheHit: false,
  });

  const guidelines = await analyzeBrand(brandName, venueType);

  // Update cache
  brandGuidelinesCache.set(cacheKey, guidelines);

  return guidelines;
}
