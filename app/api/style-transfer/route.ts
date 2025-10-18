/**
 * Style-Transfer Generation API Route
 *
 * Main "Generate" button endpoint for transferring architectural styles.
 * Uses Nano Banana (Gemini 2.5 Flash Image) for image generation.
 *
 * Requires source image (design). Reference image (style) is optional.
 */

import { NextRequest, NextResponse } from "next/server";
import { imageGenerationRateLimiter, getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import { generateStyleTransferPrompt } from "@/lib/api/workflows/styleTransfer/promptGenerator";
import {
  geminiClient,
  GEMINI_MODELS,
  buildGenerationConfig,
  generateSingleImage,
  parseImageFromResponse,
} from "@/lib/api/providers/gemini";
import { StyleTransferSettingsType } from "@/types/workflows/styleTransferSettings";

/**
 * POST /api/style-transfer
 *
 * Main generation endpoint - Transfers architectural style from reference to source
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
        "style-transfer-api"
      );
    }

    // Rate limiting
    const rateLimitResult = imageGenerationRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const body = await req.json();
    const { prompt, sourceImage, referenceImage, settings } = body;

    // Validate source image (design to transform)
    if (!sourceImage || !sourceImage.data) {
      return NextResponse.json(
        { error: "Source image (design) is required" },
        { status: 400 }
      );
    }

    // Reference image is optional - presets can be used without reference image

    apiLogger.info("Style-Transfer: Starting generation", {
      clientId,
      hasPrompt: !!prompt,
      hasSettings: !!settings,
    });

    // Generate enhanced prompt
    const enhancedPrompt = generateStyleTransferPrompt(
      settings as StyleTransferSettingsType,
      prompt || ""
    );

    apiLogger.debug("Style-Transfer: Prompt generated", {
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
    // 2. Reference image (style to transfer) - OPTIONAL
    // 3. Source image LAST (to preserve aspect ratio)
    const parts: any[] = [{ text: enhancedPrompt }];

    // Add reference image if provided
    if (referenceImage?.data) {
      parts.push({
        inlineData: {
          mimeType: referenceImage.mimeType || "image/jpeg",
          data: referenceImage.data,
        },
      });
    }

    // Source image LAST to preserve aspect ratio
    parts.push({
      inlineData: {
        mimeType: sourceImage.mimeType || "image/jpeg",
        data: sourceImage.data,
      },
    });

    apiLogger.info("Style-Transfer: Generating with Nano Banana", {
      clientId,
      promptLength: enhancedPrompt.length,
      imageCount: referenceImage?.data ? 2 : 1, // source + optional reference
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
      throw new Error("No image generated");
    }

    apiLogger.info("Style-Transfer: Generation successful", {
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
    apiLogger.error(
      "Style-Transfer: Generation failed",
      error instanceof Error ? error : undefined,
      {
        clientId,
      }
    );

    return handleApiError(error, "style-transfer-api");
  }
}
