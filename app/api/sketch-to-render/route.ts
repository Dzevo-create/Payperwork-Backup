/**
 * Sketch-to-Render Generation API Route
 *
 * Main "Generate" button endpoint for transforming sketches into photorealistic renderings.
 * Uses Nano Banana (Gemini 2.5 Flash Image / Payperwork Flash v.1) for image generation.
 *
 * Workflow:
 * 1. Validates API keys and rate limits
 * 2. Enhances prompt with GPT-4o Vision (analyzes sketch structure)
 * 3. Prepares images in correct order (reference first, source LAST)
 * 4. Generates rendering with Nano Banana
 * 5. Returns generated image with metadata
 *
 * @endpoint POST /api/sketch-to-render
 */

import { NextRequest, NextResponse } from "next/server";
import { imageGenerationRateLimiter, getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import {
  enhanceSketchToRenderPrompt,
  prepareImagesForGeneration,
  validateImages,
  buildArchitecturalPrompt
} from "@/lib/api/workflows/sketchToRender";
import {
  geminiClient,
  GEMINI_MODELS,
  buildGenerationConfig,
  generateSingleImage,
  parseImageFromResponse,
} from "@/lib/api/providers/gemini";
import { RenderSettingsType } from "@/types/workflows/renderSettings";

/**
 * POST /api/sketch-to-render
 *
 * Main generation endpoint - Transforms sketch to photorealistic rendering
 * Uses Nano Banana (Gemini 2.5 Flash Image / Payperwork Flash v.1)
 */
export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    // API Key validation
    const keyValidation = validateApiKeys(["google-gemini"]);
    if (!keyValidation.valid) {
      return keyValidation.errorResponse!;
    }

    // Content-Type validation
    if (!validateContentType(req)) {
      return handleApiError(
        new Error("Content-Type must be application/json"),
        "sketch-to-render-api"
      );
    }

    // Rate limiting
    const rateLimitResult = imageGenerationRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const body = await req.json();
    const { prompt, sourceImage, referenceImage, settings } = body;

    // Validate images
    const validation = validateImages(sourceImage, referenceImage ? [referenceImage] : undefined);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    apiLogger.info("Sketch-to-Render: Starting generation", {
      clientId,
      hasPrompt: !!prompt,
      hasReference: !!referenceImage,
      hasSettings: !!settings,
    });

    // Step 1: Enhance prompt with GPT-4o Vision (analyzes sketch)
    let enhancedPrompt: string;

    try {
      enhancedPrompt = await enhanceSketchToRenderPrompt(
        prompt || "photorealistic architectural rendering",
        sourceImage,
        settings as RenderSettingsType | undefined,
        referenceImage ? [referenceImage] : undefined
      );

      apiLogger.debug("Sketch-to-Render: Prompt enhanced", {
        clientId,
        originalLength: prompt?.length || 0,
        enhancedLength: enhancedPrompt.length,
      });
    } catch (error) {
      apiLogger.warn("Sketch-to-Render: Prompt enhancement failed, using fallback", {
        error,
        clientId,
      });
      // Fallback: use basic prompt with settings
      enhancedPrompt = buildArchitecturalPrompt(
        prompt || "photorealistic architectural rendering",
        settings as RenderSettingsType | undefined
      );
    }

    // CRITICAL: Prepend structure preservation instruction DIRECTLY for Gemini
    // This ensures Gemini ALWAYS sees this instruction, regardless of GPT-4o output
    const geminiPrompt = `IMAGE-TO-IMAGE RENDERING: Transform this sketch into a FULLY PHOTOREALISTIC rendering.

CRITICAL RULES:
- Use the EXACT camera angle, perspective, viewpoint from the source image (last image)
- EXACT same layout, proportions, composition, and framing
- COMPLETELY PHOTOREALISTIC - NO sketch lines, NO drawing lines, NO line art visible
- Replace ALL sketch elements with photorealistic materials, lighting, and textures
- The output must look like a REAL PHOTOGRAPH, not a drawing
- HIDE all construction lines, guide lines, and sketch marks
- Apply realistic surface details, reflections, and shadows

${enhancedPrompt}

REMINDER: Fully photorealistic output with ZERO visible sketch lines.`;

    apiLogger.debug("Sketch-to-Render: Final Gemini prompt prepared", {
      clientId,
      finalPromptLength: geminiPrompt.length,
    });

    // Step 2: Prepare images for Nano Banana
    // IMPORTANT: Source image MUST be LAST (determines aspect ratio)
    const images = prepareImagesForGeneration(
      sourceImage,
      referenceImage ? [referenceImage] : undefined
    );

    apiLogger.debug("Sketch-to-Render: Images prepared", {
      clientId,
      imageCount: images.length,
      lastImageIsSource: true, // Always true per our logic
    });

    // Step 3: Initialize Nano Banana (Gemini 2.5 Flash Image)
    const model = geminiClient.getGenerativeModel({
      model: GEMINI_MODELS.imageGeneration, // gemini-2.5-flash-image-preview
    });

    // Step 4: Build generation config
    const generationConfig = buildGenerationConfig(settings);

    // Step 5: Build content parts (text + images)
    // Use geminiPrompt (with prepended structure preservation instructions)
    const parts = [
      { text: geminiPrompt },
      ...images.map(img => img)
    ];

    apiLogger.info("Sketch-to-Render: Generating with Nano Banana", {
      clientId,
      promptLength: geminiPrompt.length,
      imageCount: images.length,
    });

    // Step 6: Generate rendering with Nano Banana
    const result = await generateSingleImage(
      model,
      parts,
      generationConfig,
      0,
      1,
      clientId
    );

    // Step 7: Parse generated image
    const generatedImage = parseImageFromResponse(result, 0, 1, clientId);

    if (!generatedImage) {
      throw new Error("Failed to generate rendering");
    }

    apiLogger.info("Sketch-to-Render: Generation successful", {
      clientId,
      imageMimeType: generatedImage.mimeType,
    });

    // Step 8: Return result with metadata
    return NextResponse.json({
      image: generatedImage,
      metadata: {
        prompt: prompt || null,
        enhancedPrompt, // GPT-4o enhanced prompt
        finalPrompt: geminiPrompt, // Final prompt sent to Gemini (with structure preservation)
        settings: settings || null,
        timestamp: new Date().toISOString(),
        model: GEMINI_MODELS.imageGeneration,
      }
    });

  } catch (error) {
    apiLogger.error("Sketch-to-Render: Generation failed", {
      error,
      clientId,
    });
    return handleApiError(error, "sketch-to-render-api");
  }
}
