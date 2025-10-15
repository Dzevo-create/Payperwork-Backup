import { NextRequest, NextResponse } from "next/server";
import { getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError } from "@/lib/api-error-handler";
import { generateSketchToRenderPrompt } from "@/lib/api/workflows/sketchToRender";
import { RenderSettingsType } from "@/types/workflows/renderSettings";

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

    apiLogger.info("T-Button: Generating prompt", {
      clientId,
      hasUserPrompt: !!userPrompt,
      hasReference: !!referenceImage,
      hasSettings: !!settings,
    });

    // Generate prompt using dedicated T-Button function
    const generatedPrompt = await generateSketchToRenderPrompt(
      userPrompt || null,
      sourceImage,
      settings as RenderSettingsType | undefined,
      referenceImage
    );

    apiLogger.info("T-Button: Prompt generated successfully", {
      clientId,
      promptLength: generatedPrompt.length,
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
