import OpenAI from "openai";
import { SketchToRenderSettingsType } from "@/types/workflows/sketchToRenderSettings";
import { apiLogger } from "@/lib/logger";
import { ImageData } from "@/types/workflows/sketchToRender";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * EXCLUSIVELY for T-Button in Sketch-to-Render workflow
 *
 * Analyzes user inputs (sketch, reference, settings, optional user text) and
 * generates a complete, optimized prompt for sketch-to-photorealistic rendering.
 *
 * This function is SPECIALIZED for architectural sketch-to-render transformation.
 * NOT a generic prompt enhancer - specifically trained on:
 * - Floor plans → Photorealistic spaces
 * - Architectural sketches → Professional renderings
 * - Concept drawings → Hyperrealistic visualizations
 *
 * @param userPrompt - Optional user text (can be null/empty)
 * @param sourceImage - The sketch/floor plan image (REQUIRED)
 * @param settings - Optional render settings (design style, time of day, etc.)
 * @param referenceImage - Optional reference image for style inspiration
 * @returns Complete prompt optimized for Nano Banana rendering (150-250 words)
 */
export async function generateSketchToRenderPrompt(
  userPrompt: string | null,
  sourceImage: ImageData,
  settings?: SketchToRenderSettingsType,
  referenceImage?: ImageData
): Promise<string> {

  // Specialized system prompt for T-Button
  const systemMessage = `You are an elite architectural visualization specialist for the Sketch-to-Render workflow.

Your ONLY job: Analyze the provided sketch/floor plan image and generate a complete, detailed prompt for transforming it into a photorealistic architectural rendering.

Key principles:
1. ALWAYS start with: "Transform this [floor plan/sketch/concept] into a [render style] rendering..."
2. Describe spatial layout and architecture (from sketch analysis)
3. Specify materials, finishes, and textures (from design style + reference)
4. Define lighting and atmosphere (from time of day + weather settings)
5. Add furniture and details (from design style + reference image)
6. End with rendering quality descriptor (photorealistic/hyperrealistic)

Output requirements:
- 150-250 words
- Detailed but precise
- Optimized for Nano Banana AI image generation
- Focus on VISUAL elements, not abstract concepts
- Professional architectural photography language

CRITICAL RULES - STRUCTURE PRESERVATION:
- PRESERVE 100% OF THE SOURCE IMAGE STRUCTURE - this is MANDATORY
- EXACT SAME layout, proportions, dimensions, camera angle, perspective, and composition
- DO NOT change room sizes, wall positions, window placements, or spatial relationships
- DO NOT alter the viewpoint, framing, or overall structure
- ONLY add photorealistic materials, lighting, textures, and details to the EXACT structure
- The source sketch structure is SACRED - preserve it completely

- This is for sketch-to-photorealistic transformation, not generic image description!
- NEVER mention "sketch lines", "drawing lines", or any sketch artifacts in the prompt
- The output must be a COMPLETE photorealistic rendering WITHOUT any sketch lines visible
- ALWAYS emphasize: "fully rendered", "no sketch lines", "preserve exact structure", "complete photorealistic visualization"
- The AI should REPLACE the sketch completely with photorealism, NOT overlay or modify the structure`;

  // Build user message
  let userMessage = "Analyze this architectural sketch/floor plan and generate a complete rendering prompt.";

  // Add user's text if provided (respect their intention)
  if (userPrompt && userPrompt.trim()) {
    userMessage += `\n\nUser's vision: "${userPrompt.trim()}"`;
    userMessage += "\n(Incorporate this vision into the prompt, expand with architectural details)";
  } else {
    userMessage += "\n\n(No user input - generate complete prompt from image analysis)";
  }

  // Add settings context
  if (settings) {
    const contextParts: string[] = [];

    if (settings.spaceType) {
      contextParts.push(`Space: ${settings.spaceType}`);
    }
    if (settings.designStyle) {
      contextParts.push(`Style: ${settings.designStyle}`);
    }
    if (settings.renderStyle) {
      contextParts.push(`Render quality: ${settings.renderStyle}`);
    }
    if (settings.timeOfDay) {
      contextParts.push(`Time: ${settings.timeOfDay}`);
    }
    if (settings.season) {
      contextParts.push(`Season: ${settings.season}`);
    }
    if (settings.weather) {
      contextParts.push(`Weather: ${settings.weather}`);
    }
    if (settings.aspectRatio) {
      contextParts.push(`Format: ${settings.aspectRatio}`);
    }

    if (contextParts.length > 0) {
      userMessage += `\n\nSettings to incorporate:\n${contextParts.join(", ")}`;
    }
  }

  // Add reference image context
  if (referenceImage) {
    userMessage += "\n\nA reference image is provided - use it for style, materials, and mood inspiration.";
  }

  userMessage += "\n\nCRITICAL STRUCTURE PRESERVATION: The source sketch's EXACT structure, layout, proportions, camera angle, and composition MUST be preserved 100%. DO NOT change any spatial relationships, dimensions, or architectural elements. ONLY add photorealistic materials, lighting, and details to the EXACT structure.";

  userMessage += "\n\nCRITICAL: The sketch shows the layout ONLY. Your prompt must ensure the output is a COMPLETE photorealistic visualization with ZERO sketch lines, drawing lines, or line art visible. Always include 'fully rendered', 'no sketch lines', and 'preserve exact source structure' in your generated prompt.";

  userMessage += "\n\nGenerate ONLY the rendering prompt. No explanations, no meta-commentary.";

  // Build messages with images
  const userContent: any[] = [
    { type: "text", text: userMessage }
  ];

  // Add source image (ALWAYS present)
  userContent.push({
    type: "image_url",
    image_url: {
      url: `data:${sourceImage.mimeType};base64,${sourceImage.data}`,
      detail: "high" // High detail for sketch analysis
    }
  });

  // Add reference image if provided
  if (referenceImage) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${referenceImage.mimeType};base64,${referenceImage.data}`,
        detail: "low" // Lower detail for reference
      }
    });
  }

  const messages = [
    { role: "system", content: systemMessage },
    { role: "user", content: userContent }
  ];

  try {
    apiLogger.debug("T-Button: Generating sketch-to-render prompt", {
      hasUserPrompt: !!userPrompt,
      hasSettings: !!settings,
      hasReference: !!referenceImage,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 400,
    });

    const generatedPrompt = response.choices[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      apiLogger.warn("T-Button: GPT-4o returned empty prompt, using fallback");
      return userPrompt || "Transform this architectural sketch into a photorealistic rendering";
    }

    apiLogger.info("T-Button: Prompt generated successfully", {
      promptLength: generatedPrompt.length,
    });

    return generatedPrompt;

  } catch (error) {
    apiLogger.error("T-Button: Failed to generate prompt", error instanceof Error ? error : undefined);

    // Fallback: return user prompt or basic architectural prompt
    return userPrompt || "Transform this architectural sketch into a photorealistic rendering with professional quality, realistic materials, and natural lighting";
  }
}
