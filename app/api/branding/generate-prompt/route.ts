import { NextRequest, NextResponse } from "next/server";
import { getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError } from "@/lib/api-error-handler";
import { generateBrandingPrompt } from "@/lib/api/workflows/sketchToRender";
import { BrandingSettingsType } from "@/types/workflows/brandingSettings";

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
        "generate-prompt-api"
      );
    }

    const body = await req.json();
    const { userPrompt, sourceImage, referenceImage, settings } = body;

    // Validate required fields
    if (!sourceImage || !sourceImage.data || !sourceImage.mimeType) {
      return NextResponse.json(
        { error: "Source image is required for T-Button" },
        { status: 400 }
      );
    }

    apiLogger.info("Branding T-Button: Generating prompt", {
      clientId,
      hasUserPrompt: !!userPrompt,
      hasReference: !!referenceImage,
      hasSettings: !!settings,
      brand: settings?.brandingText || null,
      venueType: settings?.venueType || null,
    });

    // Generate prompt using dedicated Branding T-Button function with Brand Intelligence
    const generatedPrompt = await generateBrandingPrompt(
      userPrompt || null,
      sourceImage,
      settings as BrandingSettingsType | undefined,
      referenceImage
    );

    apiLogger.info("Branding T-Button: Prompt generated successfully", {
      clientId,
      promptLength: generatedPrompt.length,
      brand: settings?.brandingText,
    });

    return NextResponse.json({
      enhancedPrompt: generatedPrompt,
      metadata: {
        generatedAt: new Date().toISOString(),
        hadUserInput: !!userPrompt,
        usedReference: !!referenceImage,
        usedSettings: !!settings,
      }
    });

  } catch (error) {
    apiLogger.error("T-Button: Failed to generate prompt", {
      error,
      clientId,
    });
    return handleApiError(error, "generate-prompt-api");
  }
}
