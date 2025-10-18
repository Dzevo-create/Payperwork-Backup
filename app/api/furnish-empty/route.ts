/**
 * Furnish-Empty Generation API Route
 *
 * Main "Generate" button endpoint for furnishing empty rooms.
 * Uses Nano Banana (Gemini 2.5 Flash Image) for image generation.
 */

import { NextRequest, NextResponse } from "next/server";
import { imageGenerationRateLimiter, getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import { generateFurnishEmptyPrompt } from "@/lib/api/workflows/furnishEmpty/promptGenerator";
import {
  geminiClient,
  GEMINI_MODELS,
  buildGenerationConfig,
  generateSingleImage,
  parseImageFromResponse,
} from "@/lib/api/providers/gemini";
import { FurnishEmptySettingsType } from "@/types/workflows/furnishEmptySettings";

/**
 * POST /api/furnish-empty
 *
 * Main generation endpoint - Furnishes empty rooms
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
        "furnish-empty-api"
      );
    }

    // Rate limiting
    const rateLimitResult = imageGenerationRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const body = await req.json();
    const { prompt, sourceImage, settings, furnitureImages } = body;

    // Validate source image
    if (!sourceImage || !sourceImage.data) {
      return NextResponse.json({ error: "Source image (empty room) is required" }, { status: 400 });
    }

    apiLogger.info("Furnish-Empty: Starting generation", {
      clientId,
      hasPrompt: !!prompt,
      hasSettings: !!settings,
      furnitureImageCount: furnitureImages?.length || 0,
    });

    // Generate enhanced prompt
    const enhancedPrompt = generateFurnishEmptyPrompt(
      settings as FurnishEmptySettingsType,
      prompt || ""
    );

    apiLogger.debug("Furnish-Empty: Prompt generated", {
      clientId,
      promptLength: enhancedPrompt.length,
    });

    // Prepare image for generation
    const images = [
      {
        inlineData: {
          mimeType: sourceImage.mimeType || "image/jpeg",
          data: sourceImage.data,
        },
      },
    ];

    // Generate with Nano Banana
    const model = geminiClient.getGenerativeModel({
      model: GEMINI_MODELS.imageGeneration,
    });

    // Build generation config
    const generationConfig = buildGenerationConfig(settings);

    // Build content parts (text + source image + furniture images)
    const parts = [
      { text: enhancedPrompt },
      ...images.map(img => img)
    ];

    // Add furniture images if provided
    if (furnitureImages && Array.isArray(furnitureImages) && furnitureImages.length > 0) {
      furnitureImages.forEach((furnitureImg: { data: string; mimeType: string }, index: number) => {
        if (furnitureImg.data && furnitureImg.mimeType) {
          parts.push({
            inlineData: {
              data: furnitureImg.data,
              mimeType: furnitureImg.mimeType,
            },
          });
          apiLogger.info(`Added furniture image ${index + 1}`, { clientId });
        }
      });
    }

    apiLogger.info("Furnish-Empty: Generating with Nano Banana", {
      clientId,
      promptLength: enhancedPrompt.length,
      imageCount: images.length,
      furnitureImageCount: furnitureImages?.length || 0,
    });

    const result = await generateSingleImage(model, parts, generationConfig, 0, 1, clientId);
    const generatedImage = parseImageFromResponse(result, 0, 1, clientId);

    if (!generatedImage) {
      throw new Error("No image generated");
    }

    apiLogger.info("Furnish-Empty: Generation successful", {
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
    });
  } catch (error) {
    apiLogger.error("Furnish-Empty: Generation failed", error instanceof Error ? error : undefined, {
      clientId,
    });

    return handleApiError(error, "furnish-empty-api");
  }
}
