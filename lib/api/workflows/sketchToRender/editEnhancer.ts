/**
 * Edit/Refine Prompt Enhancer for Sketch-to-Render
 *
 * Enhances user's edit prompts for refining existing renders
 * Uses GPT-4o Vision to analyze the current image and improve edit instructions
 */

import { openaiClient, retryWithBackoff } from "@/lib/api/providers/openai";
import { apiLogger } from "@/lib/logger";

interface EnhanceEditPromptParams {
  editPrompt: string;
  currentImage: { data: string; mimeType: string };
  originalPrompt?: string;
}

/**
 * Enhance edit prompt with GPT-4o Vision analysis
 *
 * Analyzes the current rendered image and creates an optimized prompt
 * for making specific changes/refinements to the image
 *
 * @param editPrompt - User's edit instruction (e.g., "make sofa blue")
 * @param currentImage - The current rendered image to be edited
 * @param originalPrompt - Optional: original prompt used to create the image
 * @returns Enhanced edit prompt optimized for Nano Banana
 */
export async function enhanceEditPrompt({
  editPrompt,
  currentImage,
  originalPrompt,
}: EnhanceEditPromptParams): Promise<string> {
  const trimmedPrompt = editPrompt.trim();

  if (!trimmedPrompt) {
    apiLogger.warn("Empty edit prompt provided");
    return "Refine and improve the architectural rendering with better details and quality";
  }

  apiLogger.info("Enhancing edit prompt with GPT-4o Vision", {
    editPromptLength: trimmedPrompt.length,
    hasOriginalPrompt: !!originalPrompt,
  });

  try {
    const systemMessage = `You are an expert at refining and editing architectural renderings.

Your task: Analyze the provided rendered image and create an enhanced prompt for making the requested changes while preserving the rest of the image.

Key principles:
1. Start by describing what to KEEP from the current image (layout, overall composition, existing elements)
2. Then specify the CHANGES requested by the user
3. Ensure changes are specific and detailed
4. Maintain photorealistic quality
5. Preserve architectural accuracy

CRITICAL STRUCTURE PRESERVATION:
- PRESERVE 100% OF THE IMAGE STRUCTURE - this is MANDATORY
- EXACT SAME layout, proportions, dimensions, camera angle, perspective, and composition
- DO NOT change room sizes, wall positions, window placements, or spatial relationships
- DO NOT alter the viewpoint, framing, or overall structure
- ONLY modify the specific elements requested by the user (materials, colors, details, lighting)
- The existing structure is SACRED - preserve it completely

CRITICAL QUALITY:
- The output must remain a COMPLETE photorealistic rendering
- NO sketch lines or artifacts should appear
- Changes should blend seamlessly with existing elements
- Always include "fully rendered", "photorealistic", and "preserve exact structure"

Output: A detailed prompt (max 200 words) optimized for image-to-image generation that makes the requested changes while preserving the existing rendering quality and EXACT structure.`;

    let userMessage = `Analyze this architectural rendering and create an optimized prompt for the following edit request: "${trimmedPrompt}"`;

    if (originalPrompt) {
      userMessage += `\n\nOriginal prompt used: "${originalPrompt}"`;
      userMessage += `\nUse this as context for what should be preserved.`;
    }

    userMessage += `\n\nCRITICAL STRUCTURE PRESERVATION:
- PRESERVE 100% of the image structure, layout, proportions, camera angle, and composition
- DO NOT change spatial relationships, dimensions, or architectural elements
- ONLY modify the specific elements mentioned in the edit request

IMPORTANT:
- Describe what to KEEP from the current image (preserve the good parts including EXACT structure)
- Then specify the CHANGES to make (only the specific elements requested)
- Ensure seamless integration of changes
- Maintain photorealistic quality with no sketch lines
- Include "preserve exact structure" in the prompt

Provide ONLY the enhanced edit prompt, no explanations.`;

    // Build messages with image
    interface MessageContent {
      type: "text" | "image_url";
      text?: string;
      image_url?: {
        url: string;
        detail: "high" | "low";
      };
    }

    interface ChatMessage {
      role: "system" | "user";
      content: string | MessageContent[];
    }

    const messages: ChatMessage[] = [
      { role: "system", content: systemMessage },
      {
        role: "user",
        content: [
          { type: "text", text: userMessage },
          {
            type: "image_url",
            image_url: {
              url: `data:${currentImage.mimeType};base64,${currentImage.data}`,
              detail: "high",
            },
          },
        ],
      },
    ];

    // Call GPT-4o with retry logic
    const response = await retryWithBackoff(
      () =>
        openaiClient.chat.completions.create({
          model: "gpt-4o",
          messages: messages as never, // OpenAI SDK requires complex ChatCompletionMessageParam[] type
          temperature: 0.7,
          max_tokens: 300,
        }),
      3, // maxRetries
      1000 // baseDelay
    );

    const enhancedPrompt = response.choices[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      apiLogger.error("GPT-4o returned empty enhanced edit prompt");
      // Fallback to original edit prompt
      return `${trimmedPrompt}, photorealistic, fully rendered, maintain architectural quality`;
    }

    apiLogger.info("Successfully enhanced edit prompt", {
      originalLength: trimmedPrompt.length,
      enhancedLength: enhancedPrompt.length,
    });

    return enhancedPrompt;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    apiLogger.error("Failed to enhance edit prompt", error instanceof Error ? error : undefined, {
      editPrompt: trimmedPrompt,
      errorMessage,
    });

    // Fallback: add basic enhancement to original prompt
    apiLogger.warn("Falling back to basic prompt enhancement");
    return `${trimmedPrompt}, photorealistic rendering, fully rendered, maintain architectural quality and composition`;
  }
}
