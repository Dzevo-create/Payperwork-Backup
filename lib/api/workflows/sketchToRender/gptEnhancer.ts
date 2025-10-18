/**
 * GPT-4o Prompt Enhancement for Sketch-to-Render Workflow
 *
 * Uses OpenAI GPT-4o to enhance user prompts with architectural details.
 * Transforms simple prompts into detailed, professional architectural visualization descriptions.
 */

import { openaiClient, OPENAI_ENHANCEMENT_CONFIG, retryWithBackoff } from "@/lib/api/providers/openai";
import { SketchToSketchToRenderSettingsType } from "@/types/workflows/sketchToRenderSettings";
import { apiLogger } from "@/lib/logger";

/**
 * System prompt for architectural rendering enhancement
 * Defines the AI's role and expertise
 */
const ARCHITECTURAL_ENHANCEMENT_SYSTEM_PROMPT = `You are an expert architectural visualization specialist with deep knowledge of:
- Architectural design principles and styles
- Professional rendering techniques and lighting
- Material specifications and textures
- Spatial composition and atmosphere
- Interior and exterior design elements

Your task is to enhance user prompts for generating photorealistic architectural renderings.
Transform simple or vague descriptions into detailed, professional architectural visualization prompts.

Guidelines:
- Include specific materials, textures, and finishes
- Describe lighting conditions and atmospheric effects
- Specify architectural details and proportions
- Add environmental context and composition elements
- Use professional architectural terminology
- Keep the enhanced prompt focused and clear
- Maintain the user's original intent and style preferences
- Do NOT add unnecessary flourishes or over-complicate

Output ONLY the enhanced prompt text. No explanations, no preamble, no quotation marks.`;

/**
 * Builds context from render settings for prompt enhancement
 *
 * @param settings - Render settings to include as context
 * @returns Context string for GPT-4o
 */
function buildSettingsContext(settings?: SketchToRenderSettingsType): string {
  if (!settings) {
    return "";
  }

  const contextParts: string[] = [];

  if (settings.spaceType) {
    contextParts.push(`Space: ${settings.spaceType}`);
  }

  if (settings.designStyle) {
    contextParts.push(`Design style: ${settings.designStyle}`);
  }

  if (settings.renderStyle) {
    contextParts.push(`Render style: ${settings.renderStyle}`);
  }

  if (settings.timeOfDay) {
    contextParts.push(`Time of day: ${settings.timeOfDay}`);
  }

  if (settings.season) {
    contextParts.push(`Season: ${settings.season}`);
  }

  if (settings.weather) {
    contextParts.push(`Weather: ${settings.weather}`);
  }

  if (settings.quality) {
    contextParts.push(`Quality level: ${settings.quality}`);
  }

  if (contextParts.length === 0) {
    return "";
  }

  return `\n\nSettings context:\n${contextParts.join("\n")}`;
}

/**
 * Enhances a user prompt for architectural rendering using GPT-4o
 *
 * Transforms simple prompts into detailed architectural visualization descriptions.
 * Optionally includes render settings as context for more targeted enhancement.
 *
 * @param userPrompt - The user's base prompt to enhance
 * @param settings - Optional render settings for context
 * @returns Promise resolving to enhanced prompt string
 * @throws Error if enhancement fails or API returns empty response
 *
 * @example
 * ```typescript
 * const enhanced = await enhanceArchitecturalPrompt(
 *   "modern living room",
 *   {
 *     designStyle: "modern",
 *     renderStyle: "photorealistic",
 *     timeOfDay: "evening",
 *     quality: "ultra"
 *   }
 * );
 * // Returns detailed architectural prompt with materials, lighting, etc.
 * ```
 */
export async function enhanceArchitecturalPrompt(
  userPrompt: string,
  settings?: SketchToRenderSettingsType
): Promise<string> {
  // Validate input
  if (!userPrompt || typeof userPrompt !== "string") {
    throw new Error("User prompt is required and must be a string");
  }

  const trimmedPrompt = userPrompt.trim();
  if (trimmedPrompt.length === 0) {
    throw new Error("User prompt cannot be empty");
  }

  // Build user message with settings context
  let userMessage = `Enhance this architectural rendering prompt: "${trimmedPrompt}"`;

  const settingsContext = buildSettingsContext(settings);
  if (settingsContext) {
    userMessage += settingsContext;
  }

  userMessage += "\n\nProvide ONLY the enhanced prompt text, no explanations.";

  apiLogger.debug("Enhancing architectural prompt with GPT-4o", {
    originalPrompt: trimmedPrompt,
    hasSettings: !!settings,
    settingsContext: !!settingsContext,
  });

  try {
    // Call OpenAI GPT-4o with retry logic
    const response = await retryWithBackoff(
      () =>
        openaiClient.chat.completions.create({
          ...OPENAI_ENHANCEMENT_CONFIG,
          messages: [
            { role: "system", content: ARCHITECTURAL_ENHANCEMENT_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
      3, // maxRetries
      1000 // baseDelay
    );

    const enhancedPrompt = response.choices[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      apiLogger.error("GPT-4o returned empty enhanced prompt");
      // Fallback to original prompt instead of throwing
      return trimmedPrompt;
    }

    apiLogger.info("Successfully enhanced architectural prompt", {
      originalLength: trimmedPrompt.length,
      enhancedLength: enhancedPrompt.length,
    });

    return enhancedPrompt;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    apiLogger.error("Failed to enhance architectural prompt", error instanceof Error ? error : undefined, {
      originalPrompt: trimmedPrompt,
      errorMessage,
    });

    // Fallback to original prompt on error
    apiLogger.warn("Falling back to original prompt due to enhancement error");
    return trimmedPrompt;
  }
}

/**
 * Specialized prompt enhancer for Sketch-to-Render workflow
 * Analyzes the source sketch image and creates an optimized architectural rendering prompt
 *
 * This is different from generic image enhancement - it's specifically trained to:
 * - Understand architectural sketches, floor plans, and concepts
 * - Transform sketch descriptions into photorealistic rendering prompts
 * - Add architectural details, materials, lighting, and atmosphere
 *
 * @param userPrompt - User's description/intent for the rendering
 * @param sourceImage - The sketch/floor plan image to analyze
 * @param settings - Optional render settings for context
 * @param referenceImages - Optional reference images for style inspiration
 * @returns Promise resolving to enhanced prompt string
 *
 * @example
 * ```typescript
 * const enhanced = await enhanceSketchToRenderPrompt(
 *   "Make it modern and bright",
 *   { data: base64SketchData, mimeType: "image/png" },
 *   { designStyle: "modern", timeOfDay: "morning" },
 *   [{ data: base64RefData, mimeType: "image/jpeg" }]
 * );
 * ```
 */
export async function enhanceSketchToRenderPrompt(
  userPrompt: string,
  sourceImage: { data: string; mimeType: string },
  settings?: SketchToRenderSettingsType,
  referenceImages?: Array<{ data: string; mimeType: string }>
): Promise<string> {
  // ULTRA-SIMPLIFIED: Direct instruction for 1:1 image-to-image rendering
  const systemMessage = `You create prompts for IMAGE-TO-IMAGE PHOTOREALISTIC rendering.

CRITICAL RULES:
- SAME camera angle, perspective, viewpoint as source
- SAME layout, proportions, dimensions as source
- SAME composition and framing as source
- COMPLETELY PHOTOREALISTIC - NO sketch lines visible in output
- Transform sketch into REAL PHOTOGRAPH appearance
- ONLY add: photorealistic materials, lighting, textures, surface details

Start EVERY prompt with: "Exact same camera angle and perspective as source. Fully photorealistic, no sketch lines."

Keep prompts under 80 words. Output ONLY the prompt.`;

  // Build ultra-simple user message
  let userMessage = `Prompt for this image as photorealistic render.`;

  if (userPrompt) {
    userMessage += ` Style: ${userPrompt}`;
  }

  if (settings) {
    const parts: string[] = [];
    if (settings.designStyle) parts.push(settings.designStyle);
    if (settings.timeOfDay) parts.push(settings.timeOfDay);
    if (settings.weather) parts.push(settings.weather);

    if (parts.length > 0) {
      userMessage += `. Settings: ${parts.join(", ")}`;
    }
  }

  userMessage += `\n\nMUST start with: "Exact same camera angle and perspective as source. Fully photorealistic, no sketch lines."`;

  // OpenAI message types
  interface TextContent {
    type: "text";
    text: string;
  }

  interface ImageContent {
    type: "image_url";
    image_url: {
      url: string;
      detail: "high" | "low";
    };
  }

  type MessageContent = TextContent | ImageContent;

  interface ChatMessage {
    role: "system" | "user";
    content: string | MessageContent[];
  }

  // Build messages with images
  const messages: ChatMessage[] = [{ role: "system", content: systemMessage }];

  // Add user message with source image
  const userContent: MessageContent[] = [
    { type: "text", text: userMessage },
    {
      type: "image_url",
      image_url: {
        url: `data:${sourceImage.mimeType};base64,${sourceImage.data}`,
        detail: "high",
      },
    },
  ];

  // Add reference images if provided (low detail)
  if (referenceImages && referenceImages.length > 0) {
    for (const refImg of referenceImages) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${refImg.mimeType};base64,${refImg.data}`,
          detail: "low",
        },
      });
    }
  }

  messages.push({
    role: "user",
    content: userContent,
  });

  apiLogger.debug("Enhancing sketch-to-render prompt (simplified)", {
    hasUserPrompt: !!userPrompt,
    hasSettings: !!settings,
    referenceImageCount: referenceImages?.length || 0,
  });

  try {
    // Cast messages to any for OpenAI SDK compatibility (SDK uses complex internal types)
    const response = await retryWithBackoff(
      () =>
        openaiClient.chat.completions.create({
          model: "gpt-4o",
          messages: messages as never, // OpenAI SDK requires complex ChatCompletionMessageParam[] type
          temperature: 0.3, // Lower temperature for more consistent structure preservation
          max_tokens: 200, // Shorter prompts
        }),
      3,
      1000
    );

    const enhancedPrompt = response.choices[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      apiLogger.warn("GPT-4o returned empty, using fallback");
      return `Exact same camera angle and perspective as source. Fully photorealistic, no sketch lines. ${settings?.designStyle || "architectural"} rendering with realistic materials, surface details, and ${settings?.timeOfDay || "natural"} lighting. Output must look like a real photograph.`;
    }

    apiLogger.debug("Prompt enhanced (simplified)", {
      originalLength: userPrompt?.length || 0,
      enhancedLength: enhancedPrompt.length,
    });

    return enhancedPrompt;
  } catch (error) {
    apiLogger.error("Failed to enhance prompt", error instanceof Error ? error : undefined);
    return `Exact same camera angle and perspective as source. Fully photorealistic, no sketch lines. ${settings?.designStyle || "architectural"} rendering with realistic materials and textures. Must look like a real photograph, not a drawing.`;
  }
}

/**
 * Batch enhance multiple prompts
 * Useful for enhancing reference prompts or multiple variations
 *
 * @param prompts - Array of prompts to enhance
 * @param settings - Optional render settings for context
 * @returns Promise resolving to array of enhanced prompts
 */
export async function enhanceArchitecturalPromptBatch(
  prompts: string[],
  settings?: SketchToRenderSettingsType
): Promise<string[]> {
  if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
    throw new Error("Prompts array is required and cannot be empty");
  }

  apiLogger.info("Batch enhancing architectural prompts", {
    count: prompts.length,
  });

  try {
    // Enhance prompts sequentially to avoid rate limits
    const enhancedPrompts: string[] = [];

    for (const prompt of prompts) {
      const enhanced = await enhanceArchitecturalPrompt(prompt, settings);
      enhancedPrompts.push(enhanced);

      // Small delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return enhancedPrompts;
  } catch (error) {
    apiLogger.error("Failed to batch enhance prompts", error instanceof Error ? error : undefined);
    throw error;
  }
}

/**
 * Configuration options for prompt enhancement
 */
export interface EnhancementOptions {
  /** Include materials and textures in enhancement */
  includeMaterials?: boolean;
  /** Include lighting details in enhancement */
  includeLighting?: boolean;
  /** Include atmospheric effects in enhancement */
  includeAtmosphere?: boolean;
  /** Maximum length of enhanced prompt */
  maxLength?: number;
  /** Temperature for GPT-4o (0.0 - 2.0) */
  temperature?: number;
}

/**
 * Enhanced prompt generation with custom options
 *
 * @param userPrompt - The user's base prompt
 * @param settings - Optional render settings
 * @param options - Enhancement options
 * @returns Promise resolving to enhanced prompt
 */
export async function enhanceArchitecturalPromptWithOptions(
  userPrompt: string,
  settings?: SketchToRenderSettingsType,
  options?: EnhancementOptions
): Promise<string> {
  // Build custom system prompt based on options
  let systemPrompt = ARCHITECTURAL_ENHANCEMENT_SYSTEM_PROMPT;

  if (options) {
    const customInstructions: string[] = [];

    if (options.includeMaterials === false) {
      customInstructions.push("- Do not add material or texture details");
    }

    if (options.includeLighting === false) {
      customInstructions.push("- Do not add lighting details");
    }

    if (options.includeAtmosphere === false) {
      customInstructions.push("- Do not add atmospheric effects");
    }

    if (options.maxLength) {
      customInstructions.push(`- Keep the enhanced prompt under ${options.maxLength} characters`);
    }

    if (customInstructions.length > 0) {
      systemPrompt += "\n\nAdditional constraints:\n" + customInstructions.join("\n");
    }
  }

  // Build user message
  let userMessage = `Enhance this architectural rendering prompt: "${userPrompt.trim()}"`;
  const settingsContext = buildSettingsContext(settings);
  if (settingsContext) {
    userMessage += settingsContext;
  }
  userMessage += "\n\nProvide ONLY the enhanced prompt text, no explanations.";

  try {
    const response = await retryWithBackoff(
      () =>
        openaiClient.chat.completions.create({
          model: OPENAI_ENHANCEMENT_CONFIG.model,
          temperature: options?.temperature || OPENAI_ENHANCEMENT_CONFIG.temperature,
          max_tokens: OPENAI_ENHANCEMENT_CONFIG.max_tokens,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      3,
      1000
    );

    return response.choices[0]?.message?.content?.trim() || userPrompt.trim();
  } catch (error) {
    apiLogger.error("Failed to enhance prompt with options", error instanceof Error ? error : undefined);
    return userPrompt.trim();
  }
}
