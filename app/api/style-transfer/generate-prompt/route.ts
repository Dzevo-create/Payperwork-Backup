import { NextRequest, NextResponse } from "next/server";
import { getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError } from "@/lib/api-error-handler";
import { generateStyleTransferPrompt } from "@/lib/api/workflows/styleTransfer/promptGenerator";
import { enhanceStyleTransferPrompt } from "@/lib/api/workflows/common/universalGptEnhancer";
import { StyleTransferSettingsType } from "@/types/workflows/styleTransferSettings";
import { LRUCache, createObjectCacheKey } from "@/lib/cache/lruCache";
import { perfMonitor } from "@/lib/performance/monitor";

// Cache for generated prompts - 10 minute TTL, max 50 entries
const promptCache = new LRUCache<string>(50, 10 * 60 * 1000);

/**
 * POST /api/style-transfer/generate-prompt
 *
 * T-Button endpoint - Generates prompt from user inputs
 * Exclusive to Style-Transfer workflow
 *
 * This endpoint analyzes the source sketch/floor plan along with optional
 * reference images and settings to generate an optimized architectural
 * rendering prompt using GPT-4o vision capabilities.
 */
export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  const startTime = perfMonitor.startTimer();

  try {
    // API Key validation
    const keyValidation = validateApiKeys(["openai"]);
    if (!keyValidation.valid) {
      perfMonitor.recordMetric('generate-prompt', startTime, false, { reason: 'invalid-api-key' });
      return keyValidation.errorResponse!;
    }

    // Content-Type validation
    if (!validateContentType(req)) {
      perfMonitor.recordMetric('generate-prompt', startTime, false, { reason: 'invalid-content-type' });
      return handleApiError(
        new Error("Content-Type must be application/json"),
        "generate-prompt-api"
      );
    }

    const body = await req.json();
    const { userPrompt, sourceImage, referenceImage, settings } = body;

    // Validate required fields
    if (!sourceImage || !sourceImage.data || !sourceImage.mimeType) {
      perfMonitor.recordMetric('generate-prompt', startTime, false, { reason: 'missing-source-image' });
      return NextResponse.json(
        { error: "Source image is required for T-Button" },
        { status: 400 }
      );
    }

    // Create cache key from request parameters
    const cacheKey = createObjectCacheKey({
      userPrompt: userPrompt || '',
      // Use a hash of image data to avoid storing large strings in cache key
      sourceImageHash: sourceImage.data.substring(0, 100),
      referenceImageHash: referenceImage?.data?.substring(0, 100) || '',
      settings: JSON.stringify(settings || {}),
      type: 'style-transfer'
    });

    // Check cache
    const cachedPrompt = promptCache.get(cacheKey);
    if (cachedPrompt) {
      apiLogger.info("T-Button: Using cached prompt", {
        clientId,
        cacheHit: true,
        promptLength: cachedPrompt.length,
      });

      perfMonitor.recordMetric('generate-prompt', startTime, true, {
        cached: true,
        type: 'style-transfer'
      });

      return NextResponse.json({
        enhancedPrompt: cachedPrompt,
        metadata: {
          generatedAt: new Date().toISOString(),
          hadUserInput: !!userPrompt,
          usedReference: !!referenceImage,
          usedSettings: !!settings,
          cached: true
        }
      });
    }

    apiLogger.info("T-Button: Generating prompt", {
      clientId,
      hasUserPrompt: !!userPrompt,
      hasReference: !!referenceImage,
      hasSettings: !!settings,
      cacheHit: false,
    });

    // Generate prompt using GPT-4o Vision to analyze the empty room image
    let generatedPrompt: string;

    try {
      // Try universal GPT-4 Vision enhancer for intelligent, context-aware prompt generation
      generatedPrompt = await enhanceStyleTransferPrompt({
        userPrompt: userPrompt || "",
        sourceImage,
        settings: settings as StyleTransferSettingsType,
        referenceImages: referenceImage ? [referenceImage] : undefined
      });

      apiLogger.info("T-Button: Universal GPT-4 Vision prompt generated", {
        clientId,
        workflow: 'style-transfer',
        promptLength: generatedPrompt.length,
      });
    } catch (gptError) {
      // Fallback to static prompt generator if GPT-4 fails
      apiLogger.warn("T-Button: Universal GPT-4 Vision failed, using static generator", {
        clientId,
        workflow: 'style-transfer',
        error: gptError instanceof Error ? gptError.message : String(gptError),
      });

      generatedPrompt = generateStyleTransferPrompt(
        settings as StyleTransferSettingsType,
        userPrompt || undefined
      );
    }

    // Store in cache
    promptCache.set(cacheKey, generatedPrompt);

    apiLogger.info("T-Button: Prompt generated successfully", {
      clientId,
      promptLength: generatedPrompt.length,
      cached: false,
    });

    perfMonitor.recordMetric('generate-prompt', startTime, true, {
      cached: false,
      type: 'style-transfer',
      promptLength: generatedPrompt.length
    });

    return NextResponse.json({
      enhancedPrompt: generatedPrompt,
      metadata: {
        generatedAt: new Date().toISOString(),
        hadUserInput: !!userPrompt,
        usedReference: !!referenceImage,
        usedSettings: !!settings,
        cached: false
      }
    });

  } catch (error) {
    apiLogger.error("T-Button: Failed to generate prompt", error instanceof Error ? error : undefined, {
      clientId,
    });
    perfMonitor.recordMetric('generate-prompt', startTime, false, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return handleApiError(error, "generate-prompt-api");
  }
}
