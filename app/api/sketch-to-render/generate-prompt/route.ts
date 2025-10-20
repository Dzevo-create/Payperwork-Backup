import { NextRequest, NextResponse } from "next/server";
import { getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError } from "@/lib/api-error-handler";
import { generateSketchToRenderPrompt, generateBrandingPrompt } from "@/lib/api/workflows/sketchToRender";
import { enhanceSketchToRenderPrompt, enhanceBrandingPrompt } from "@/lib/api/workflows/common/universalGptEnhancer";
import { generateIntelligentFallback } from "@/lib/api/workflows/common/intelligentFallbacks";
import { SketchToRenderSettingsType } from "@/types/workflows/sketchToRenderSettings";
import { BrandingSettingsType } from "@/types/workflows/brandingSettings";
import { LRUCache, createObjectCacheKey } from "@/lib/cache/lruCache";
import { perfMonitor } from "@/lib/performance/monitor";

// Cache for generated prompts - 10 minute TTL, max 50 entries
const promptCache = new LRUCache<string>(50, 10 * 60 * 1000);

/**
 * POST /api/sketch-to-render/generate-prompt
 *
 * T-Button endpoint - Generates prompt from user inputs
 * Exclusive to Sketch-to-Render workflow
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

    // Check if this is a branding request (has brandingText or venueType)
    const isBrandingRequest = settings && ('brandingText' in settings || 'venueType' in settings);

    // Create cache key from request parameters
    const cacheKey = createObjectCacheKey({
      userPrompt: userPrompt || '',
      // Use a hash of image data to avoid storing large strings in cache key
      sourceImageHash: sourceImage.data.substring(0, 100),
      referenceImageHash: referenceImage?.data?.substring(0, 100) || '',
      settings: JSON.stringify(settings || {}),
      type: isBrandingRequest ? 'branding' : 'sketch'
    });

    // Check cache (DISABLED during development for testing new TWO-STEP prompts)
    const CACHE_ENABLED = process.env.NODE_ENV === 'production';
    const cachedPrompt = CACHE_ENABLED ? promptCache.get(cacheKey) : null;

    if (cachedPrompt) {
      apiLogger.info("T-Button: Using cached prompt", {
        clientId,
        cacheHit: true,
        promptLength: cachedPrompt.length,
      });

      perfMonitor.recordMetric('generate-prompt', startTime, true, {
        cached: true,
        type: isBrandingRequest ? 'branding' : 'sketch'
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
      isBranding: isBrandingRequest,
      cacheHit: false,
    });

    // Generate prompt using universal GPT-4 Vision enhancer
    let generatedPrompt: string;

    try {
      if (isBrandingRequest) {
        // Use universal branding prompt enhancer
        generatedPrompt = await enhanceBrandingPrompt({
          userPrompt: userPrompt || "",
          sourceImage,
          settings: settings as BrandingSettingsType || {},
          referenceImages: referenceImage ? [referenceImage] : undefined
        });

        apiLogger.info("T-Button: Universal GPT-4 Vision prompt generated", {
          clientId,
          workflow: 'branding',
          promptLength: generatedPrompt.length,
        });
      } else {
        // Use universal sketch-to-render prompt enhancer
        generatedPrompt = await enhanceSketchToRenderPrompt({
          userPrompt: userPrompt || "",
          sourceImage,
          settings: settings as SketchToRenderSettingsType || {},
          referenceImages: referenceImage ? [referenceImage] : undefined
        });

        apiLogger.info("T-Button: Universal GPT-4 Vision prompt generated", {
          clientId,
          workflow: 'sketch-to-render',
          promptLength: generatedPrompt.length,
        });
      }
    } catch (gptError) {
      // Fallback to intelligent prompt generator (NO API calls required)
      const errorMessage = gptError instanceof Error ? gptError.message : String(gptError);
      const isQuotaError = errorMessage.includes('429') || errorMessage.includes('quota');

      apiLogger.warn("T-Button: Universal GPT-4 Vision failed, using intelligent fallback", {
        clientId,
        workflow: isBrandingRequest ? 'branding' : 'sketch-to-render',
        error: errorMessage,
        isQuotaError,
        fallbackType: 'intelligent-settings-based'
      });

      // Use intelligent fallback that builds prompts from settings
      generatedPrompt = generateIntelligentFallback(
        isBrandingRequest ? 'branding' : 'sketch-to-render',
        userPrompt || '',
        settings || {}
      );
    }

    // Store in cache
    promptCache.set(cacheKey, generatedPrompt);

    apiLogger.info("T-Button: Prompt generated successfully", {
      clientId,
      workflow: isBrandingRequest ? 'branding' : 'sketch-to-render',
      promptLength: generatedPrompt.length,
      cached: false,
    });

    perfMonitor.recordMetric('generate-prompt', startTime, true, {
      cached: false,
      type: isBrandingRequest ? 'branding' : 'sketch',
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
