import { NextRequest, NextResponse } from "next/server";
import { apiRateLimiter, getClientId } from "@/lib/rate-limit";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import { enhancePrompt } from "@/lib/api/providers/openai";
import { detectEnhancementContext } from "@/lib/api/utils/contextDetection";
import { apiLogger } from '@/lib/logger';
import {
  buildNanoBananaPrompt,
  buildImageGenerationPrompt,
  buildVideoGenerationPrompt,
  buildChatPrompt,
  buildAnalysisPrompt,
} from "@/lib/api/prompts/enhancementPrompts";

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
        "enhance-prompt-api"
      );
    }

    // Rate limiting
    const rateLimitResult = apiRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    const {
      prompt,
      mode,
      hasImage,
      imageContext,
      replyContext,
      pdfContext,
      videoContext,
      imageSettings,
    } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt provided" }, { status: 400 });
    }

    // Detect context
    const context = detectEnhancementContext({
      mode,
      hasImage: hasImage || false,
      imageContext: imageContext || "",
      replyContext: replyContext || "",
      imageSettings,
      videoContext,
    });

    apiLogger.debug('Context detected:');
    apiLogger.debug('📝 Original prompt:');
    if (imageSettings) {
      apiLogger.debug('🎨 Image settings:');
    }

    // Get appropriate system prompt based on context
    let systemPrompt: string;
    switch (context) {
      case "nano_banana":
        systemPrompt = buildNanoBananaPrompt(
          imageContext || "",
          imageSettings,
          replyContext || "",
          pdfContext || undefined
        );
        break;
      case "image_generate":
        systemPrompt = buildImageGenerationPrompt(
          imageSettings,
          replyContext || "",
          pdfContext || undefined
        );
        break;
      case "video_generate":
        systemPrompt = buildVideoGenerationPrompt(
          videoContext || "",
          replyContext || "",
          pdfContext || undefined
        );
        break;
      case "analyze":
        systemPrompt = buildAnalysisPrompt(
          imageContext || "",
          replyContext || "",
          pdfContext || undefined
        );
        break;
      default:
        systemPrompt = buildChatPrompt(replyContext || "", pdfContext || undefined);
    }

    // Use OpenAI to enhance the prompt
    const enhancedPrompt = await enhancePrompt(prompt, systemPrompt);

    apiLogger.info('Enhanced prompt:');

    return NextResponse.json({ enhancedPrompt });
  } catch (error) {
    return handleApiError(error, "enhance-prompt-api");
  }
}
