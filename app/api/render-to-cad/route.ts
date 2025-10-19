/**
 * Render-to-CAD Generation API Route
 *
 * Main "Generate" button endpoint for converting renderings/photos to CAD drawings.
 * Uses Nano Banana (Gemini 2.5 Flash Image) for image generation.
 *
 * Requires source image (rendering or photo).
 */

import { NextRequest, NextResponse } from "next/server";
import { imageGenerationRateLimiter, getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import { generateRenderToCadPrompt } from "@/lib/api/workflows/renderToCad/promptGenerator";
import {
  geminiClient,
  GEMINI_MODELS,
  buildGenerationConfig,
  generateSingleImage,
  parseImageFromResponse,
} from "@/lib/api/providers/gemini";
import { RenderToCadSettingsType } from "@/types/workflows/renderToCadSettings";

/**
 * POST /api/render-to-cad
 *
 * Main generation endpoint - Converts rendering/photo to CAD drawing
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
        "render-to-cad-api"
      );
    }

    // Rate limiting
    const rateLimitResult = imageGenerationRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const body = await req.json();
    const { prompt, sourceImage, settings } = body;

    // Validate source image (rendering/photo to convert)
    if (!sourceImage || !sourceImage.data) {
      return NextResponse.json(
        { error: "Source image (rendering/photo) is required" },
        { status: 400 }
      );
    }

    apiLogger.info("Render-to-CAD: Starting generation", {
      clientId,
      hasPrompt: !!prompt,
      hasSettings: !!settings,
    });

    // Generate enhanced prompt
    const enhancedPrompt = generateRenderToCadPrompt(
      prompt || "",
      settings as RenderToCadSettingsType
    );

    apiLogger.debug("Render-to-CAD: Prompt generated", {
      clientId,
      promptLength: enhancedPrompt.length,
    });

    // Generate with Nano Banana
    const model = geminiClient.getGenerativeModel({
      model: GEMINI_MODELS.imageGeneration,
    });

    // Build generation config
    const generationConfig = buildGenerationConfig(settings);

    // Build content parts:
    // 1. Text prompt first
    // 2. Source image (rendering/photo to convert to CAD)
    const parts: any[] = [
      { text: enhancedPrompt },
      {
        inlineData: {
          mimeType: sourceImage.mimeType || "image/jpeg",
          data: sourceImage.data,
        },
      },
    ];

    apiLogger.info("Render-to-CAD: Generating with Nano Banana", {
      clientId,
      promptLength: enhancedPrompt.length,
      imageCount: 1,
    });

    const result = await generateSingleImage(
      model,
      parts,
      generationConfig,
      0,
      1,
      clientId
    );
    const generatedImage = parseImageFromResponse(result, 0, 1, clientId);

    if (!generatedImage) {
      throw new Error("No CAD drawing generated");
    }

    apiLogger.info("Render-to-CAD: Generation successful", {
      clientId,
      imageMimeType: generatedImage.mimeType,
    });

    return NextResponse.json({
      image: {
        data: generatedImage.data,
        mimeType: generatedImage.mimeType,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        prompt: prompt || "",
        enhancedPrompt,
        settings,
      },
      model: GEMINI_MODELS.imageGeneration,
    });
  } catch (error) {
    apiLogger.error("Render-to-CAD: Generation failed", {
      clientId,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return handleApiError(error, "render-to-cad-api");
  }
}
