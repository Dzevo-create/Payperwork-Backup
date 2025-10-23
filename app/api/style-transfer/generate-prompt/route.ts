import { NextRequest, NextResponse } from "next/server";
import { getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError } from "@/lib/api-error-handler";
import {
  generateStyleTransferPrompt,
  generateReferencePromptWithStyleAnalysis,
} from "@/lib/api/workflows/styleTransfer/promptGenerator";
import { analyzeSourceImage, formatAnalysisForPrompt } from "@/lib/ai/sourceImageAnalyzer";
import { analyzeReferenceStyleWithVision } from "@/lib/api/workflows/styleTransfer/styleAnalyzer";
import { getDefaultStyleDescription } from "@/lib/api/workflows/styleTransfer/defaultStyles";
import { StyleTransferSettingsType } from "@/types/workflows/styleTransferSettings";
import { LRUCache, createObjectCacheKey } from "@/lib/cache/lruCache";
import { perfMonitor } from "@/lib/performance/monitor";

// Cache for generated prompts - 10 minute TTL, max 50 entries
const promptCache = new LRUCache<string>(50, 10 * 60 * 1000);

/**
 * POST /api/style-transfer/generate-prompt
 *
 * ✨ Style Transfer-specific T-Button API (IMPERATIVE PROMPTS)
 *
 * Generates imperative, action-oriented prompts for architectural style transfer.
 * This is shown in the Frontend when user clicks T-Button (Type icon).
 *
 * PROCESS:
 * 1. Analyze source image: "WHAT IS in the building"
 * 2. Analyze reference style (if provided): "WHAT STYLE to apply"
 * 3. Generate imperative prompt: "HOW TO transform the building"
 *
 * EXAMPLE OUTPUT:
 * ```
 * ARCHITECTURAL STYLE TRANSFER - INSTRUCTION SET
 *
 * SOURCE: Modern 3-story residential building with rectangular windows
 * REFERENCE STYLE: Mediterranean style with arched windows, terracotta tiles
 *
 * TRANSFORMATION COMMANDS (HIGH INTENSITY):
 * WINDOWS - CHANGE COMPLETELY:
 * IDENTIFY current windows in source building
 * REPLACE window shapes with: arched windows with decorative surrounds
 * MODIFY frames to include wooden shutters
 * ADD all decorative elements (moldings, trim)
 * ```
 */
export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  const startTime = perfMonitor.startTimer();

  try {
    // API Key validation
    const keyValidation = validateApiKeys(["openai"]);
    if (!keyValidation.valid) {
      perfMonitor.recordMetric("generate-prompt", startTime, false, { reason: "invalid-api-key" });
      return keyValidation.errorResponse!;
    }

    // Content-Type validation
    if (!validateContentType(req)) {
      perfMonitor.recordMetric("generate-prompt", startTime, false, {
        reason: "invalid-content-type",
      });
      return handleApiError(
        new Error("Content-Type must be application/json"),
        "generate-prompt-api"
      );
    }

    const body = await req.json();
    const { userPrompt, sourceImage, referenceImage, settings } = body;

    // Validate required fields
    if (!sourceImage || !sourceImage.data || !sourceImage.mimeType) {
      perfMonitor.recordMetric("generate-prompt", startTime, false, {
        reason: "missing-source-image",
      });
      return NextResponse.json({ error: "Source image is required for T-Button" }, { status: 400 });
    }

    // Create cache key from request parameters
    const cacheKey = createObjectCacheKey({
      userPrompt: userPrompt || "",
      // Use a hash of image data to avoid storing large strings in cache key
      sourceImageHash: sourceImage.data.substring(0, 100),
      referenceImageHash: referenceImage?.data?.substring(0, 100) || "",
      settings: JSON.stringify(settings || {}),
      type: "style-transfer",
    });

    // Check cache
    const cachedPrompt = promptCache.get(cacheKey);
    if (cachedPrompt) {
      apiLogger.info("T-Button: Using cached prompt", {
        clientId,
        cacheHit: true,
        promptLength: cachedPrompt.length,
      });

      perfMonitor.recordMetric("generate-prompt", startTime, true, {
        cached: true,
        type: "style-transfer",
      });

      return NextResponse.json({
        enhancedPrompt: cachedPrompt,
        metadata: {
          generatedAt: new Date().toISOString(),
          hadUserInput: !!userPrompt,
          usedReference: !!referenceImage,
          usedSettings: !!settings,
          cached: true,
        },
      });
    }

    apiLogger.info("Style-Transfer T-Button: Generating prompt", {
      component: "API",
      clientId,
      hasUserPrompt: !!userPrompt,
      hasReference: !!referenceImage,
      hasSettings: !!settings,
      mode: settings.mode,
      cacheHit: false,
    });

    // ✅ PHASE 1: Analyze SOURCE Image (WHAT IS)
    apiLogger.info("Style-Transfer T-Button: Phase 1 - Analyzing source image", {
      component: "API",
    });

    let sourceImageDescription: string | undefined;
    try {
      const sourceAnalysis = await analyzeSourceImage(
        sourceImage.data,
        sourceImage.mimeType || "image/jpeg",
        "style-transfer"
      );
      sourceImageDescription = formatAnalysisForPrompt(sourceAnalysis);

      apiLogger.info("Style-Transfer T-Button: Source analysis complete", {
        component: "API",
        descriptionLength: sourceImageDescription.length,
      });
    } catch (error) {
      apiLogger.warn("Style-Transfer T-Button: Source analysis failed, continuing without", error);
    }

    // ✅ PHASE 2: Generate Transformation Prompt (WHAT SHOULD BECOME)
    let generatedPrompt: string;
    const hasReferenceImage = !!referenceImage?.data;

    if (hasReferenceImage) {
      // MODE 2: Reference Image Style Analysis
      apiLogger.info("Style-Transfer T-Button: Phase 2 - Reference mode - analyzing reference", {
        component: "API",
      });

      try {
        const styleDescription = await analyzeReferenceStyleWithVision(
          referenceImage.data,
          referenceImage.mimeType || "image/jpeg"
        );

        apiLogger.info("Style-Transfer T-Button: Reference style analysis complete", {
          component: "API",
          materials: styleDescription.materials.length,
          colors: styleDescription.colors.length,
          hasWindowStyle: !!styleDescription.windowStyle,
          hasFacadeStructure: !!styleDescription.facadeStructure,
        });

        // ✅ Generate IMPERATIVE prompt with style analysis
        generatedPrompt = generateReferencePromptWithStyleAnalysis(
          settings as StyleTransferSettingsType,
          styleDescription,
          userPrompt || "",
          sourceImageDescription
        );

        apiLogger.info("Style-Transfer T-Button: Imperative prompt generated", {
          component: "API",
          promptLength: generatedPrompt.length,
          materials: styleDescription.materials.join(", "),
        });
      } catch (error) {
        // Fallback: Use default style description
        apiLogger.warn("Style-Transfer T-Button: Reference analysis failed, using defaults", error);

        const defaultStyle = getDefaultStyleDescription();
        generatedPrompt = generateReferencePromptWithStyleAnalysis(
          settings as StyleTransferSettingsType,
          defaultStyle,
          userPrompt || "",
          sourceImageDescription
        );
      }
    } else {
      // MODE 1: Preset Mode (without Reference Image)
      apiLogger.info("Style-Transfer T-Button: Phase 2 - Preset mode", {
        component: "API",
      });

      generatedPrompt = generateStyleTransferPrompt(
        settings as StyleTransferSettingsType,
        false, // hasReferenceImage = false
        userPrompt || ""
      );

      apiLogger.info("Style-Transfer T-Button: Preset prompt generated", {
        component: "API",
        promptLength: generatedPrompt.length,
      });
    }

    // Store in cache
    promptCache.set(cacheKey, generatedPrompt);

    apiLogger.info("Style-Transfer T-Button: Prompt generated successfully", {
      component: "API",
      clientId,
      promptLength: generatedPrompt.length,
      cached: false,
    });

    perfMonitor.recordMetric("generate-prompt", startTime, true, {
      cached: false,
      type: "style-transfer",
      promptLength: generatedPrompt.length,
    });

    return NextResponse.json({
      enhancedPrompt: generatedPrompt,
      metadata: {
        generatedAt: new Date().toISOString(),
        hadUserInput: !!userPrompt,
        usedReference: hasReferenceImage,
        sourceAnalysis: sourceImageDescription || "No source analysis available",
        mode: settings.mode,
        styleIntensity: settings.styleIntensity,
        structurePreservation: settings.structurePreservation,
        cached: false,
      },
    });
  } catch (error) {
    apiLogger.error(
      "T-Button: Failed to generate prompt",
      error instanceof Error ? error : undefined,
      {
        clientId,
      }
    );
    perfMonitor.recordMetric("generate-prompt", startTime, false, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return handleApiError(error, "generate-prompt-api");
  }
}
