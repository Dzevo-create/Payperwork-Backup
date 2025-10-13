import { NextRequest, NextResponse } from "next/server";
import ProviderFactory from "@/lib/video/providers/ProviderFactory";
import { ENV } from "@/lib/video/config/videoConfig";
import type { VideoModel, VideoType, VideoGenerationRequest } from "@/types/video";
import { videoGenerationRateLimiter, getClientId } from "@/lib/rate-limit";
import { apiLogger } from "@/lib/logger";
import { textValidation, ValidationError } from "@/lib/validation";
import { validateApiKeys, validateContentType } from "@/lib/api-security";
import { handleApiError, rateLimitErrorResponse } from "@/lib/api-error-handler";
import { validateVideoGenerationRequest, validateVideoStatusRequest } from "@/lib/video/validation/videoValidation";

// ============================================================================
// VIDEO GENERATION API ROUTES
// Clean, refactored version using provider abstraction (v2)
// ============================================================================

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/generate-video
 * Create a new video generation task
 */
export async function POST(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    // Content-Type validation
    if (!validateContentType(req)) {
      return handleApiError(
        new Error('Content-Type must be application/json'),
        'generate-video-api'
      );
    }

    // Parse body to check model BEFORE API key validation
    const body: VideoGenerationRequest = await req.json();
    const { model, type, prompt } = body;

    // Validate model first
    if (!model || !["payperwork-v1", "payperwork-v2"].includes(model)) {
      return NextResponse.json(
        { error: "Invalid or missing model. Must be 'payperwork-v1' or 'payperwork-v2'" },
        { status: 400 }
      );
    }

    // Dynamic API Key validation based on model
    const requiredKeys = model === "payperwork-v1" ? ['kling'] : ['fal'];
    const keyValidation = validateApiKeys(requiredKeys);
    if (!keyValidation.valid) {
      return keyValidation.errorResponse!;
    }

    // Rate limiting
    const rateLimitResult = videoGenerationRateLimiter.check(clientId);
    if (!rateLimitResult.success) {
      return rateLimitErrorResponse(rateLimitResult.reset);
    }

    // Validate type
    if (!type) {
      return NextResponse.json(
        { error: "Missing required parameter: type" },
        { status: 400 }
      );
    }

    if (!["text2video", "image2video"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'text2video' or 'image2video'" },
        { status: 400 }
      );
    }

    // Validate prompt
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing prompt" },
        { status: 400 }
      );
    }

    try {
      textValidation.validatePrompt(prompt);
    } catch (error) {
      if (error instanceof ValidationError) {
        apiLogger.warn('Invalid video prompt', { error: error.message, clientId });
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      throw error;
    }

    // Get provider (singleton) and create task
    const provider = ProviderFactory.getProvider(model);
    const response = await provider.createTask(body);

    apiLogger.info('Video generation task created', { taskId: response.task_id, model, clientId });

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, 'generate-video-api');
  }
}

/**
 * GET /api/generate-video?task_id=xxx&model=xxx&type=xxx
 * Check the status of a video generation task
 */
export async function GET(req: NextRequest) {
  const clientId = getClientId(req);

  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("task_id");
    const model = searchParams.get("model") as VideoModel;
    const type = searchParams.get("type") as VideoType;

    if (!taskId) {
      return NextResponse.json(
        { error: "task_id parameter is required" },
        { status: 400 }
      );
    }

    if (!model) {
      return NextResponse.json(
        { error: "model parameter is required" },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        { error: "type parameter is required" },
        { status: 400 }
      );
    }

    // Validate model
    if (!["payperwork-v1", "payperwork-v2"].includes(model)) {
      return NextResponse.json(
        { error: "Invalid model. Must be 'payperwork-v1' or 'payperwork-v2'" },
        { status: 400 }
      );
    }

    // Dynamic API Key validation based on model
    const requiredKeys = model === "payperwork-v1" ? ['kling'] : ['fal'];
    const keyValidation = validateApiKeys(requiredKeys);
    if (!keyValidation.valid) {
      return keyValidation.errorResponse!;
    }

    // ⚠️ NO rate limiting for status checks (GET) - allow frequent polling
    // Rate limiting is only applied to video creation (POST)

    // Validate type
    if (!["text2video", "image2video"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'text2video' or 'image2video'" },
        { status: 400 }
      );
    }

    // Get provider (singleton) and check status
    const provider = ProviderFactory.getProvider(model);

    apiLogger.debug('Checking video status', { taskId, model, type, clientId });

    const response = await provider.checkStatus(taskId, type);

    apiLogger.info('Video status retrieved', {
      taskId,
      model,
      status: response.status,
      clientId
    });

    // Cache completed/failed videos for 1 hour (immutable)
    // Don't cache processing status (changes frequently)
    if (response.status === "succeed" || response.status === "failed") {
      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, max-age=3600, immutable',
          'CDN-Cache-Control': 'max-age=3600',
        },
      });
    }

    // Don't cache processing status
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    apiLogger.error('Video status check failed', error instanceof Error ? error : undefined, {
      taskId,
      model,
      type,
      clientId,
      errorDetails: error instanceof Error ? undefined : error,
    });
    return handleApiError(error, 'generate-video-status-api');
  }
}
