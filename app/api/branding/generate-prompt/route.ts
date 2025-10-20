import { NextRequest, NextResponse } from "next/server";
import { getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError } from "@/lib/api-error-handler";
import { generateBrandingPrompt } from "@/lib/api/workflows/sketchToRender";
import { enhanceBrandingPrompt } from "@/lib/api/workflows/common/universalGptEnhancer";
import { BrandingSettingsType } from "@/types/workflows/brandingSettings";
import { LRUCache, createObjectCacheKey } from "@/lib/cache/lruCache";
import { perfMonitor } from "@/lib/performance/monitor";

// Cache for generated branding prompts - 10 minute TTL, max 50 entries
const brandingPromptCache = new LRUCache<string>(50, 10 * 60 * 1000);

/**
 * POST /api/branding/generate-prompt
 *
 * T-Button endpoint - Generates prompt from user inputs
 * Exclusive to Branding workflow
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
      perfMonitor.recordMetric('branding-generate-prompt', startTime, false, { reason: 'invalid-api-key' });
      return keyValidation.errorResponse!;
    }

    // Content-Type validation
    if (!validateContentType(req)) {
      perfMonitor.recordMetric('branding-generate-prompt', startTime, false, { reason: 'invalid-content-type' });
      return handleApiError(
        new Error("Content-Type must be application/json"),
        "generate-prompt-api"
      );
    }

    const body = await req.json();
    const { userPrompt, sourceImage, referenceImage, settings } = body;

    // Validate required fields
    if (!sourceImage || !sourceImage.data || !sourceImage.mimeType) {
      perfMonitor.recordMetric('branding-generate-prompt', startTime, false, { reason: 'missing-source-image' });
      return NextResponse.json(
        { error: "Source image is required for T-Button" },
        { status: 400 }
      );
    }

    // Create cache key from request parameters
    const cacheKey = createObjectCacheKey({
      userPrompt: userPrompt || '',
      sourceImageHash: sourceImage.data.substring(0, 100),
      referenceImageHash: referenceImage?.data?.substring(0, 100) || '',
      settings: JSON.stringify(settings || {}),
      type: 'branding'
    });

    // Check cache
    const cachedPrompt = brandingPromptCache.get(cacheKey);
    if (cachedPrompt) {
      apiLogger.info("Branding T-Button: Using cached prompt", {
        clientId,
        cacheHit: true,
        promptLength: cachedPrompt.length,
        brand: settings?.brandingText,
      });

      perfMonitor.recordMetric('branding-generate-prompt', startTime, true, {
        cached: true,
        brand: settings?.brandingText
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

    apiLogger.info("Branding T-Button: Generating prompt", {
      clientId,
      hasUserPrompt: !!userPrompt,
      hasReference: !!referenceImage,
      hasSettings: !!settings,
      brand: settings?.brandingText || null,
      venueType: settings?.venueType || null,
      cacheHit: false,
    });

    // Generate prompt using universal GPT-4 Vision enhancer
    let generatedPrompt: string;

    try {
      // Use universal branding prompt enhancer with GPT-4 Vision
      generatedPrompt = await enhanceBrandingPrompt({
        userPrompt: userPrompt || "",
        sourceImage,
        settings: settings as BrandingSettingsType || {},
        referenceImages: referenceImage ? [referenceImage] : undefined
      });

      apiLogger.info("Branding T-Button: Universal GPT-4 Vision prompt generated", {
        clientId,
        workflow: 'branding',
        promptLength: generatedPrompt.length,
        brand: settings?.brandingText,
      });
    } catch (gptError) {
      // Fallback to static prompt generator if GPT-4 fails
      apiLogger.warn("Branding T-Button: Universal GPT-4 Vision failed, using static generator", {
        clientId,
        workflow: 'branding',
        error: gptError instanceof Error ? gptError.message : String(gptError),
      });

      generatedPrompt = await generateBrandingPrompt(
        userPrompt || null,
        sourceImage,
        settings as BrandingSettingsType | undefined,
        referenceImage ? [referenceImage] : undefined
      );
    }

    // Store in cache
    brandingPromptCache.set(cacheKey, generatedPrompt);

    apiLogger.info("Branding T-Button: Prompt generated successfully", {
      clientId,
      promptLength: generatedPrompt.length,
      brand: settings?.brandingText,
      cached: false,
    });

    perfMonitor.recordMetric('branding-generate-prompt', startTime, true, {
      cached: false,
      brand: settings?.brandingText,
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
    apiLogger.error("Branding T-Button: Failed to generate prompt", error instanceof Error ? error : undefined, {
      clientId,
    });
    perfMonitor.recordMetric('branding-generate-prompt', startTime, false, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return handleApiError(error, "generate-prompt-api");
  }
}
