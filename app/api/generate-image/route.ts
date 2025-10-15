import { NextRequest, NextResponse } from "next/server";
import { imageGenerationRateLimiter, getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { textValidation, fileValidation, ValidationError } from "@/lib/validation";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import { cropBlackBorders } from "@/lib/utils/imageCrop";
import {
  geminiClient,
  GEMINI_MODELS,
  buildEnhancedImagePrompt,
  buildGenerationConfig,
  buildContentParts,
  parseImageFromResponse,
  generateSingleImage,
} from "@/lib/api/providers/gemini";

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    // API Key validation
    const keyValidation = validateApiKeys(["openai"]);
    if (!keyValidation.valid) {
      return keyValidation.errorResponse!;
    }

    // Content-Type validation
    if (!validateContentType(req)) {
      return handleApiError(
        new Error("Content-Type must be application/json"),
        "generate-image-api"
      );
    }

    // Rate limiting
    const rateLimitResult = imageGenerationRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const { prompt, referenceImages, settings } = await req.json();

    // Validate prompt
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt provided" }, { status: 400 });
    }

    try {
      textValidation.validatePrompt(prompt);
    } catch (error) {
      if (error instanceof ValidationError) {
        apiLogger.warn("Invalid image prompt", { error: error.message, clientId });
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    // Validate reference images if provided
    if (referenceImages && Array.isArray(referenceImages)) {
      for (const img of referenceImages) {
        if (img.data) {
          try {
            const base64Data = `data:${img.mimeType || "image/png"};base64,${img.data}`;
            fileValidation.validateBase64Image(base64Data);
          } catch (error) {
            if (error instanceof ValidationError) {
              apiLogger.warn("Invalid reference image", { error: error.message, clientId });
              return NextResponse.json({ error: error.message }, { status: 400 });
            }
            throw error;
          }
        }
      }
    }

    // Initialize Nano Banana model (Gemini 2.5 Flash Image)
    const model = geminiClient.getGenerativeModel({
      model: GEMINI_MODELS.imageGeneration,
    });

    // Build enhanced prompt with settings
    const enhancedPrompt = buildEnhancedImagePrompt(prompt, settings);

    apiLogger.debug("Enhanced prompt with settings", {
      originalPrompt: prompt,
      enhancedPrompt,
      settings,
      clientId,
    });

    // Build content parts
    const parts = buildContentParts(enhancedPrompt, referenceImages);

    // Build generation config
    const generationConfig = buildGenerationConfig(settings);

    // Determine number of images to generate (default: 1)
    const numImages = settings?.numImages || 1;

    apiLogger.debug("Generating images", { numImages, clientId });

    // Generate multiple images in parallel
    const imagePromises = Array.from({ length: numImages }, (_, index) =>
      generateSingleImage(model, parts, generationConfig, index, numImages, clientId)
    );
    const results = await Promise.all(imagePromises);

    // Parse all images
    let images = results
      .map((result, index) => parseImageFromResponse(result, index, numImages, clientId))
      .filter((img): img is { mimeType: string; data: string } => img !== null);

    if (images.length === 0) {
      const error: any = new Error("No images generated");
      error.status = 500;
      throw error;
    }

    // Auto-crop black borders for 21:9 images
    if (settings?.aspectRatio === "21:9") {
      apiLogger.debug("Auto-cropping black borders for 21:9 images", { clientId });

      const croppedImages = await Promise.all(
        images.map(async (img) => {
          try {
            return await cropBlackBorders(img.data, img.mimeType);
          } catch (error) {
            apiLogger.warn("Failed to crop black borders, using original", { error, clientId });
            return img;
          }
        })
      );

      images = croppedImages;
    }

    // Return single image or array of images
    if (numImages === 1) {
      return NextResponse.json({
        image: images[0],
      });
    } else {
      return NextResponse.json({
        images,
      });
    }
  } catch (error) {
    return handleApiError(error, "generate-image-api");
  }
}
