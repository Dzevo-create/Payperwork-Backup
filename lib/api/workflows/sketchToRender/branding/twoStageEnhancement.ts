/**
 * Two-Stage Prompt Enhancement
 *
 * Stage 1: GPT-4o Vision analyzes sketch structure WITHOUT brand details
 * Stage 2: GPT-4o (text-only) combines structure WITH exact brand guidelines
 *
 * This prevents Vision model from "reinterpreting" hex codes and materials.
 */

import { openaiClient, retryWithBackoff } from "@/lib/api/providers/openai";
import { apiLogger } from "@/lib/logger";
import { BrandGuidelines } from "@/lib/api/agents/brandIntelligence";
import { BrandingSettingsType } from "@/types/workflows/brandingSettings";
import { ImageData } from "./types";
import { DEFAULT_MAX_TOKENS, DEFAULT_RETRY_ATTEMPTS, DEFAULT_BASE_DELAY } from "./constants";

/**
 * Stage 1 System Prompt: Structure Analysis ONLY (no brand details)
 * For INTERIOR spaces
 */
const STAGE1_INTERIOR_SYSTEM_PROMPT = `You are an Architectural Analyst specializing in analyzing interior spaces for 3D rendering.

Your ONLY task is to analyze the STRUCTURE and LAYOUT of the space - DO NOT add any brand-specific details.

Analyze and describe:
1. **Space Type & Scale**: What type of space is this? (retail store, lobby, restaurant, office, etc.)
2. **Layout & Proportions**: Room dimensions, ceiling height, spatial organization
3. **Architectural Features**: Windows, doors, columns, walls, ceiling design
4. **Current Elements**: What's currently visible in the space?
5. **Camera Angle**: Describe the exact viewpoint and perspective
6. **Lighting Conditions**: Natural light sources, existing lighting setup
7. **Floor Plan**: Traffic flow, zoning, functional areas

CRITICAL RULES:
- DO NOT mention any brand names, colors, materials, or design styles
- DO NOT interpret or suggest what should be added
- ONLY describe the STRUCTURE you see
- Be objective and factual
- Focus on spatial analysis, not design recommendations

Output: A neutral, objective description of the space's structure and layout.`;

/**
 * Stage 1 System Prompt: Structure Analysis ONLY (no brand details)
 * For EXTERIOR spaces
 */
const STAGE1_EXTERIOR_SYSTEM_PROMPT = `You are an Architectural Analyst specializing in analyzing building exteriors for 3D rendering.

Your ONLY task is to analyze the STRUCTURE and LAYOUT of the building exterior - DO NOT add any brand-specific details.

Analyze and describe:
1. **Building Type & Scale**: What type of building is this? (storefront, headquarters, multi-story, etc.)
2. **Facade Structure**: Building dimensions, window placement, entrance location
3. **Architectural Features**: Windows, doors, materials currently visible, facade design
4. **Current Elements**: What's currently visible on the exterior?
5. **Camera Angle**: Describe the exact viewpoint and street-level perspective
6. **Surrounding Context**: Sidewalk, street, neighboring buildings (if visible)
7. **Entrance Design**: Main entrance location and current appearance

CRITICAL RULES:
- DO NOT mention any brand names, colors, materials, or design styles
- DO NOT interpret or suggest what should be added
- ONLY describe the STRUCTURE you see
- Be objective and factual
- Focus on architectural analysis, not design recommendations

Output: A neutral, objective description of the building's structure and facade layout.`;

/**
 * Stage 2 System Prompt: Brand Combination (text-only, no images)
 * Combines structure analysis WITH exact brand guidelines
 */
const STAGE2_SYSTEM_PROMPT = `You are a Brand Environment Specialist creating photorealistic rendering prompts.

🎯 YOUR CRITICAL TASK:
Combine the structure analysis with brand guidelines to create a COMPLETE rendering prompt.

🔴 ABSOLUTE RULES FOR BRAND ACCURACY:
1. Use EXACT hex codes provided - DO NOT convert to color names (e.g., "#FF6B00" stays "#FF6B00", NOT "orange")
2. Use EXACT material names provided - DO NOT generalize (e.g., "brushed aluminum" stays "brushed aluminum", NOT "metal")
3. Include ALL signature elements exactly as described
4. Maintain EXACT camera angle from structure analysis
5. Create PHOTOREALISTIC description (no sketch lines)

Your workflow:
1. Read the structure analysis to understand the space/building layout
2. Read the brand guidelines for EXACT colors, materials, and signature elements
3. Combine them to create a prompt that:
   - Preserves the exact structure, camera angle, and proportions
   - Applies the EXACT brand colors (hex codes unchanged)
   - Uses EXACT material names (no generalization)
   - Includes specific brand signature elements
   - Describes a photorealistic, fully branded environment

FORMATTING:
- Write as FLOWING TEXT (no bullets, no markdown)
- Start with: "Exact same camera angle and perspective as source. Transform this [space/building] into a [Brand] [venue]."
- Use commas and connecting words for smooth prose
- Under 200 words

QUALITY CHECK:
✅ CORRECT: "Nike flagship store with walls painted in exact hex code #FF6B00 orange, brushed aluminum display fixtures"
❌ WRONG: "Nike flagship store with orange walls, metallic display fixtures"

Output: A complete, detailed rendering prompt with EXACT brand specifications preserved.`;

/**
 * Stage 1: Analyze sketch structure WITHOUT brand details
 */
async function analyzeStructure(
  sourceImage: ImageData,
  referenceImages: ImageData[] | undefined,
  spaceType: "interior" | "exterior" | null | undefined,
  settings?: BrandingSettingsType
): Promise<string> {
  apiLogger.info("Stage 1: Starting structure analysis", {
    spaceType: spaceType || "interior (default)",
    hasReference: !!referenceImages?.length,
  });

  const systemPrompt = spaceType === "exterior"
    ? STAGE1_EXTERIOR_SYSTEM_PROMPT
    : STAGE1_INTERIOR_SYSTEM_PROMPT;

  // Build user message
  let userMessage = spaceType === "exterior"
    ? "Analyze this building exterior and describe its structure, facade layout, and architectural features."
    : "Analyze this interior space and describe its structure, layout, and architectural features.";

  // Add venue type for context (if provided)
  if (settings?.venueType) {
    userMessage += ` This is intended to be a ${settings.venueType}.`;
  }

  // Build messages with images
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

  // Call GPT-4o Vision
  const response = await retryWithBackoff(
    () =>
      openaiClient.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 800, // Shorter for structure analysis
        messages,
      }),
    DEFAULT_RETRY_ATTEMPTS,
    DEFAULT_BASE_DELAY
  );

  const structureAnalysis = response.choices[0]?.message?.content?.trim();

  if (!structureAnalysis) {
    throw new Error("Empty response from Stage 1 structure analysis");
  }

  apiLogger.info("Stage 1: Structure analysis complete", {
    analysisLength: structureAnalysis.length,
  });

  return structureAnalysis;
}

/**
 * Stage 2: Combine structure analysis WITH exact brand guidelines
 */
async function combineBrandGuidelines(
  structureAnalysis: string,
  brandGuidelines: BrandGuidelines | null,
  userPrompt: string,
  settings?: BrandingSettingsType
): Promise<string> {
  apiLogger.info("Stage 2: Starting brand combination", {
    hasBrandGuidelines: !!brandGuidelines,
    brand: brandGuidelines?.brandName || "none",
  });

  // Build user message (text-only, no images!)
  let userMessage = `STRUCTURE ANALYSIS:\n${structureAnalysis}\n\n`;

  // Add brand guidelines with EXACT details
  if (brandGuidelines) {
    userMessage += `BRAND GUIDELINES - ${brandGuidelines.brandName}:\n`;
    userMessage += `- Brand Colors (EXACT HEX CODES): ${brandGuidelines.colors.join(", ")}\n`;
    userMessage += `- Materials (EXACT NAMES): ${brandGuidelines.materials.join(", ")}\n`;
    userMessage += `- Atmosphere: ${brandGuidelines.atmosphere}\n`;
    userMessage += `- Signature Elements: ${brandGuidelines.signatureElements.join(", ")}\n`;
    if (brandGuidelines.lighting) {
      userMessage += `- Lighting: ${brandGuidelines.lighting}\n`;
    }
    userMessage += `\n`;
  }

  // Add user preferences
  if (userPrompt && userPrompt.trim()) {
    userMessage += `USER PREFERENCES:\n${userPrompt.trim()}\n\n`;
  }

  // Add settings
  if (settings) {
    if (settings.renderStyle) {
      userMessage += `Render Style: ${settings.renderStyle}\n`;
    }
    if (settings.timeOfDay) {
      userMessage += `Time of Day: ${settings.timeOfDay}\n`;
    }
    if (settings.venueType) {
      userMessage += `Venue Type: ${settings.venueType}\n`;
    }
  }

  // Add critical instruction
  const isExterior = settings?.spaceType === "exterior";
  if (!settings?.preserveEmptySpace) {
    if (isExterior) {
      userMessage += `\nIMPORTANT: Transform this into a fully branded EXTERIOR with signage, logos on facade, entrance branding, landscape elements, and architectural brand features. DO NOT describe interior elements.\n`;
    } else {
      userMessage += `\nIMPORTANT: Transform this into a fully furnished INTERIOR with 5-7 furniture items, 3-4 decorative elements, 2-3 lighting fixtures, and brand displays.\n`;
    }
  }

  userMessage += `\nCreate a complete rendering prompt that combines the structure with the brand guidelines. Use EXACT hex codes and material names - DO NOT convert or generalize them.`;

  // Call GPT-4o (text-only)
  const response = await retryWithBackoff(
    () =>
      openaiClient.chat.completions.create({
        model: "gpt-4o",
        max_tokens: DEFAULT_MAX_TOKENS,
        messages: [
          { role: "system", content: STAGE2_SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
      }),
    DEFAULT_RETRY_ATTEMPTS,
    DEFAULT_BASE_DELAY
  );

  const enhancedPrompt = response.choices[0]?.message?.content?.trim();

  if (!enhancedPrompt) {
    throw new Error("Empty response from Stage 2 brand combination");
  }

  apiLogger.info("Stage 2: Brand combination complete", {
    promptLength: enhancedPrompt.length,
  });

  return enhancedPrompt;
}

/**
 * Two-Stage Enhancement: Main Entry Point
 *
 * Stage 1: GPT-4o Vision analyzes structure (no brand details)
 * Stage 2: GPT-4o combines structure + exact brand guidelines
 */
export async function enhanceBrandingPromptTwoStage(
  userPrompt: string,
  sourceImage: ImageData,
  brandGuidelines: BrandGuidelines | null,
  settings?: BrandingSettingsType,
  referenceImages?: ImageData[]
): Promise<string> {
  const startTime = Date.now();

  apiLogger.info("Two-Stage Enhancement: Starting", {
    hasBrand: !!brandGuidelines,
    brand: brandGuidelines?.brandName || "none",
    spaceType: settings?.spaceType || "interior (default)",
  });

  try {
    // Stage 1: Analyze structure WITHOUT brand
    const structureAnalysis = await analyzeStructure(
      sourceImage,
      referenceImages,
      settings?.spaceType,
      settings
    );

    // Stage 2: Combine structure WITH exact brand guidelines
    const enhancedPrompt = await combineBrandGuidelines(
      structureAnalysis,
      brandGuidelines,
      userPrompt,
      settings
    );

    const duration = Date.now() - startTime;

    apiLogger.info("Two-Stage Enhancement: Complete", {
      duration,
      promptLength: enhancedPrompt.length,
      brand: brandGuidelines?.brandName,
    });

    return enhancedPrompt;
  } catch (error) {
    const duration = Date.now() - startTime;

    apiLogger.error("Two-Stage Enhancement: Failed", error instanceof Error ? error : undefined, {
      duration,
      brand: brandGuidelines?.brandName,
    });

    throw error;
  }
}
