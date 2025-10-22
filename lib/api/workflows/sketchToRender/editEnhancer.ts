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
  referenceImage?: { data: string; mimeType: string }; // ✅ NEW: Reference image for feature extraction
}

/**
 * Enhance edit prompt with GPT-4o Vision analysis
 *
 * Analyzes the current rendered image and creates an optimized prompt
 * for making specific changes/refinements to the image
 *
 * ✅ NEW: Supports reference images for targeted feature extraction
 * When referenceImage is provided, extracts specific features and applies to current image
 *
 * @param editPrompt - User's edit instruction (e.g., "make sofa blue" or "add creative windows from reference")
 * @param currentImage - The current rendered image to be edited
 * @param originalPrompt - Optional: original prompt used to create the image
 * @param referenceImage - Optional: reference image for feature extraction (windows, materials, elements)
 * @returns Enhanced edit prompt optimized for Nano Banana
 */
export async function enhanceEditPrompt({
  editPrompt,
  currentImage,
  originalPrompt,
  referenceImage,
}: EnhanceEditPromptParams): Promise<string> {
  const trimmedPrompt = editPrompt.trim();

  if (!trimmedPrompt) {
    apiLogger.warn("Empty edit prompt provided");
    return "Refine and improve the architectural rendering with better details and quality";
  }

  apiLogger.info("Enhancing edit prompt with GPT-4o Vision", {
    editPromptLength: trimmedPrompt.length,
    hasOriginalPrompt: !!originalPrompt,
    hasReferenceImage: !!referenceImage,
  });

  // ✅ REFERENCE IMAGE MODE: Feature extraction from reference image
  if (referenceImage) {
    return enhanceEditPromptWithReference({
      editPrompt: trimmedPrompt,
      currentImage,
      referenceImage,
      originalPrompt,
    });
  }

  // ✅ STANDARD MODE: Edit without reference image
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

/**
 * ✅ NEW: Enhance edit prompt WITH reference image for feature extraction
 *
 * This is DIFFERENT from Style Transfer:
 * - Style Transfer: "Reskin" entire building with reference style
 * - Edit with Reference: Extract SPECIFIC FEATURES from reference and apply to current image
 *
 * Example Use Cases:
 * - Current: Building with boring rectangular windows
 * - Reference: Building with creative round window forms
 * - Edit Prompt: "add creative windows from reference"
 * → Result: SAME building but WITH creative windows from reference
 *
 * @param editPrompt - User's edit instruction mentioning what to extract
 * @param currentImage - The current rendered image to be edited
 * @param referenceImage - Reference image to extract features from
 * @param originalPrompt - Optional: original prompt used to create current image
 * @returns Enhanced edit prompt with specific feature extraction instructions
 */
async function enhanceEditPromptWithReference({
  editPrompt,
  currentImage,
  referenceImage,
  originalPrompt,
}: EnhanceEditPromptParams & {
  referenceImage: { data: string; mimeType: string };
}): Promise<string> {
  apiLogger.info("Enhancing edit prompt WITH reference image for feature extraction", {
    editPromptLength: editPrompt.length,
    hasOriginalPrompt: !!originalPrompt,
  });

  try {
    const systemMessage = `You are an expert at extracting specific architectural features from reference images and applying them to existing buildings.

CRITICAL DISTINCTION - This is NOT Style Transfer:
- Style Transfer: "Reskin" entire building with reference style (materials, colors, complete facade)
- Feature Extraction (THIS TASK): Extract SPECIFIC FEATURES from reference and add/replace in current building

Your task:
1. Analyze the REFERENCE image to identify the specific features mentioned in the edit request
2. Analyze the CURRENT image to understand what exists now
3. Create a detailed prompt that PRESERVES current building but ADDS/REPLACES specific features from reference

CRITICAL STRUCTURE PRESERVATION:
- PRESERVE 100% of the current building's structure, volume, form, and overall design
- PRESERVE camera angle, perspective, composition, and spatial relationships
- ONLY extract and apply the SPECIFIC FEATURES mentioned in the edit request
- Think: "Keep everything, just add/change [specific feature] from reference"

WHAT TO EXTRACT FROM REFERENCE (based on edit request):
- Window forms/shapes (e.g., rounded windows, arched windows, floor-to-ceiling windows)
- Window frame styles (e.g., red frames, thin black frames, deep reveals)
- Specific materials (e.g., terracotta panels, wood cladding, metal fins)
- Architectural elements (e.g., balcony shapes, canopy designs, decorative panels)
- Facade treatment (e.g., relief depth, panel arrangement, surface articulation)
- Colors/finishes (e.g., orange paint, natural wood tone, brushed metal)
- Specific details (e.g., rounded edges, decorative patterns, sun shading elements)

WHAT TO PRESERVE FROM CURRENT:
- Overall building volume, form, and geometry
- Building proportions, height, width, depth
- Window POSITIONS and COUNT (unless edit specifically requests changing these)
- Spatial layout and composition
- Camera angle and perspective
- All elements NOT mentioned in the edit request

OUTPUT STRUCTURE:
Your enhanced prompt should have THREE clear sections:
1. PRESERVE: What to keep from current image (structure, layout, composition, camera angle)
2. EXTRACT: Specific features to extract from reference image (be VERY detailed)
3. APPLY: How to integrate extracted features into current building (seamless, photorealistic)

CRITICAL QUALITY:
- Output must remain FULLY PHOTOREALISTIC
- Extracted features should blend seamlessly with current building
- Maintain architectural coherence and realism
- No sketch lines or artifacts`;

    // Build message with BOTH images (current + reference)
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

    let userMessage = `EDIT REQUEST: "${editPrompt}"`;

    if (originalPrompt) {
      userMessage += `\n\nORIGINAL PROMPT (for context): "${originalPrompt}"`;
    }

    userMessage += `\n\nINSTRUCTIONS:
1. Analyze the REFERENCE image (second image) to identify the specific features mentioned in the edit request
2. Analyze the CURRENT image (first image) to understand what exists now
3. Create a detailed prompt that:
   - PRESERVES: Current building structure, volume, form, camera angle, composition (100% preservation)
   - EXTRACTS: Specific features from reference image (be extremely detailed about what to extract)
   - APPLIES: How to integrate extracted features seamlessly into current building

CRITICAL:
- Be VERY specific about what features to extract from reference (don't just say "windows", say "round window forms with red frames and decorative rounded panels above")
- Clearly state what to preserve from current building
- Ensure seamless, photorealistic integration
- Think: "Keep current building, just add/change [specific feature] from reference"

Provide ONLY the enhanced edit prompt in the 3-section structure (PRESERVE / EXTRACT / APPLY), no explanations.`;

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
          {
            type: "image_url",
            image_url: {
              url: `data:${referenceImage.mimeType};base64,${referenceImage.data}`,
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
          messages: messages as never,
          temperature: 0.7,
          max_tokens: 500, // More tokens for detailed feature extraction
        }),
      3, // maxRetries
      1000 // baseDelay
    );

    const enhancedPrompt = response.choices[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      apiLogger.error("GPT-4o returned empty enhanced edit prompt with reference");
      // Fallback
      return `${editPrompt}, extract features from reference image, preserve exact structure of current building, photorealistic, fully rendered`;
    }

    apiLogger.info("Successfully enhanced edit prompt with reference image", {
      originalLength: editPrompt.length,
      enhancedLength: enhancedPrompt.length,
    });

    return enhancedPrompt;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    apiLogger.error(
      "Failed to enhance edit prompt with reference",
      error instanceof Error ? error : undefined,
      {
        editPrompt,
        errorMessage,
      }
    );

    // Fallback: basic feature extraction prompt
    apiLogger.warn("Falling back to basic feature extraction prompt");
    return `Preserve the exact structure, composition, and layout of the current building. Extract the following features from the reference image: ${editPrompt}. Apply these extracted features to the current building while maintaining photorealistic quality and architectural coherence. Seamlessly integrate the new features without changing the building's overall form, volume, or camera perspective.`;
  }
}
