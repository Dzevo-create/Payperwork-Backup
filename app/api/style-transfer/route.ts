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
import {
  generateStyleTransferPrompt,
  generateReferencePromptWithStyleAnalysis,
} from "@/lib/api/workflows/styleTransfer/promptGenerator";
import {
  analyzeReferenceImage,
  getDefaultStyleDescription,
} from "@/lib/api/workflows/styleTransfer/styleAnalyzer";
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
      return NextResponse.json({ error: "Source image (design) is required" }, { status: 400 });
    }

    // Reference image is optional - presets can be used without reference image

    apiLogger.info("Style-Transfer: Starting generation", {
      clientId,
      hasPrompt: !!prompt,
      hasSettings: !!settings,
      hasReferenceImage: !!referenceImage?.data,
    });

    // Generate enhanced prompt
    // ZWEI MODI:
    // 1. Preset Mode (ohne Reference Image): Nutze Presets (Stil, Zeit, Wetter)
    // 2. Reference Mode (mit Reference Image): Analysiere Reference, extrahiere Stil
    let enhancedPrompt: string;
    const hasReferenceImage = !!referenceImage?.data;

    if (hasReferenceImage) {
      // MODE 2: Reference Image Style Analysis
      apiLogger.info(
        "Style-Transfer: Reference mode - analyzing reference image for style extraction"
      );

      try {
        // Analysiere Reference Image mit Gemini Vision
        const styleDescription = await analyzeReferenceImage(
          referenceImage.data,
          referenceImage.mimeType || "image/jpeg"
        );

        apiLogger.info("Style-Transfer: Style analysis complete", {
          materials: styleDescription.materials.length,
          colors: styleDescription.colors.length,
          overallStyle: styleDescription.overallStyle,
        });

        // Generiere Prompt MIT Stil-Beschreibung
        enhancedPrompt = generateReferencePromptWithStyleAnalysis(
          settings as StyleTransferSettingsType,
          styleDescription,
          prompt || ""
        );

        apiLogger.debug("Style-Transfer: Enhanced prompt generated from style analysis", {
          promptLength: enhancedPrompt.length,
          materials: styleDescription.materials.join(", "),
        });
      } catch (error) {
        // Fallback: Wenn Analyse fehlschlägt, nutze Default-Beschreibung
        apiLogger.warn(
          "Style-Transfer: Style analysis failed, using default description",
          error instanceof Error ? error : undefined
        );

        const defaultStyle = getDefaultStyleDescription();
        enhancedPrompt = generateReferencePromptWithStyleAnalysis(
          settings as StyleTransferSettingsType,
          defaultStyle,
          prompt || ""
        );
      }
    } else {
      // MODE 1: Preset Mode (ohne Reference Image)
      apiLogger.info("Style-Transfer: Preset mode - using preset settings");

      enhancedPrompt = generateStyleTransferPrompt(
        settings as StyleTransferSettingsType,
        false, // hasReferenceImage = false
        prompt || ""
      );

      apiLogger.debug("Style-Transfer: Preset prompt generated", {
        promptLength: enhancedPrompt.length,
      });
    }

    // Generate with Nano Banana
    const model = geminiClient.getGenerativeModel({
      model: GEMINI_MODELS.imageGeneration,
    });

    // Build generation config
    const generationConfig = buildGenerationConfig(settings);

    // Build content parts for Nano Banana:
    // WICHTIG: Reference Image wird NICHT eingespeist!
    // Reference Image wurde bereits analysiert und die Stil-Beschreibung ist im Prompt.
    //
    // Content Parts:
    // 1. Text prompt (enthält Stil-Beschreibung aus Reference Image Analyse)
    // 2. Source image (das Volumen-Modell, das transformiert werden soll)
    const parts: any[] = [{ text: enhancedPrompt }];

    // ✅ NUR Source Image wird eingespeist
    // Reference Image wird NICHT eingespeist (wurde nur für Analyse verwendet)
    parts.push({
      inlineData: {
        mimeType: sourceImage.mimeType || "image/jpeg",
        data: sourceImage.data,
      },
    });

    apiLogger.debug("Style-Transfer: Content parts built", {
      partsCount: parts.length,
      hasReferenceInParts: false, // ✅ Reference Image wird NICHT geschickt
      hasSourceInParts: true,
    });

    apiLogger.info("Style-Transfer: Generating with Nano Banana", {
      clientId,
      promptLength: enhancedPrompt.length,
      imageCount: referenceImage?.data ? 2 : 1, // source + optional reference
    });

    const result = await generateSingleImage(model, parts, generationConfig, 0, 1, clientId);
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
